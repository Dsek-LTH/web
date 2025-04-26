import {
  moveQueueForwardOneStep,
  moveQueueToCart,
  sendQueuedNotifications,
} from "$lib/server/shop/addToCart/reservations";
import authorizedPrismaClient from "$lib/server/authorizedPrisma";
import { purchaseForm } from "$lib/server/shop/cart/types";
import purchaseCart from "$lib/server/shop/payments/purchase";
import { answerQuestion } from "$lib/server/shop/questions";
import apiNames from "$lib/utils/apiNames";
import { authorize } from "$lib/utils/authorization";
import { redirect } from "$lib/utils/redirect";
import { questionForm } from "$lib/utils/shop/types";
import * as m from "$paraglide/messages";
import { error, fail, type Actions } from "@sveltejs/kit";
import { zod } from "sveltekit-superforms/adapters";
import { message, superValidate } from "sveltekit-superforms/server";
import { z } from "zod";

const cartActions: Actions = {
  removeItem: async ({ locals, request }) => {
    const { user, prisma } = locals;
    const form = await superValidate(
      request,
      zod(z.object({ id: z.string() })),
    );
    if (!form.valid) return fail(400, { form });
    if (!user?.memberId && !user?.externalCode) {
      return message(form, {
        message: m.cart_errors_noCart(),
        type: "error",
      });
    }
    const consumable = await prisma.consumable.findUnique({
      where: {
        id: form.data.id,
      },
    });
    if (!consumable) {
      return message(form, {
        message: m.cart_errors_itemNotInCart(),
        type: "error",
      });
    }
    const queuedNotifications = await authorizedPrismaClient.$transaction(
      async (tx) => {
        await tx.consumable.delete({
          where: {
            id: consumable.id,
          },
        });
        return await moveQueueToCart(tx, consumable.shoppableId, 1);
      },
    );
    sendQueuedNotifications(queuedNotifications);

    return message(form, {
      message: m.cart_itemHasBeenRemoved(),
      type: "success",
    });
  },
  removeReservation: async ({ locals, request }) => {
    const { user, prisma } = locals;
    const form = await superValidate(
      request,
      zod(z.object({ id: z.string() })),
    );
    if (!form.valid) return fail(400, { form });
    if (!user?.memberId && !user?.externalCode) {
      return message(form, {
        message: m.cart_errors_noCart(),
        type: "error",
      });
    }
    const reservation = await prisma.consumableReservation.findUnique({
      where: {
        id: form.data.id,
      },
    });
    if (!reservation) {
      return message(form, {
        message: m.cart_errors_reservationNotInCart(),
        type: "error",
      });
    }
    await authorizedPrismaClient.$transaction(async (tx) => {
      await tx.consumableReservation.delete({
        where: {
          id: reservation.id,
        },
      });
      if (reservation.order !== null)
        await moveQueueForwardOneStep(
          tx,
          reservation.shoppableId,
          reservation.order,
        );
    });

    return message(form, {
      message: m.cart_reservationHasBeenRemoved(),
      type: "success",
    });
  },
  answerQuestion: async ({ locals, request }) => {
    const { user, prisma } = locals;
    const form = await superValidate(request, zod(questionForm));
    if (!form.valid) return fail(400, { form });
    if (!user?.memberId && !user?.externalCode) {
      return message(form, {
        message: m.cart_errors_noCart(),
        type: "error",
      });
    }
    const { memberId, externalCode } = user;

    try {
      await answerQuestion(
        prisma,
        memberId
          ? { memberId }
          : {
              externalCode: externalCode!,
            },
        form.data,
      );
    } catch (e) {
      return message(form, {
        message: e instanceof Error ? e.message : `${e}`,
        type: "error",
      });
    }

    return message(form, {
      message: "Svaret har sparats.",
      type: "hidden",
    });
  },
  purchase: async (event) => {
    const { locals, request } = event;
    const { user, prisma } = locals;
    authorize(apiNames.WEBSHOP.PURCHASE, user);
    const form = await superValidate(request, zod(purchaseForm));
    if (!form.valid) return fail(400, { form });
    if (!user?.memberId && !user?.externalCode) {
      error(401, m.cart_errors_noCart());
    }
    let redirectUrl: string | undefined = undefined;
    let data: Omit<Awaited<ReturnType<typeof purchaseCart>>, "redirect">;
    try {
      const { redirect, ...rest } = await purchaseCart(
        prisma,
        user.memberId
          ? {
              memberId: user.memberId,
            }
          : {
              externalCode: user.externalCode!,
            },
        form.data.idempotencyKey,
      );
      redirectUrl = redirect;
      data = rest;
    } catch (err) {
      return message(
        form,
        {
          message: `${
            "message" in (err as Error) ? (err as Error).message : err
          }`,
          type: "error",
        },
        {
          status: 500,
        },
      );
    }

    if (redirectUrl) {
      throw redirect(redirectUrl, data as Message, event);
    }
    return message(form, data);
  },
};

export default cartActions;
