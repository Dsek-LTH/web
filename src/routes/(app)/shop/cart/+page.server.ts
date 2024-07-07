import {
  moveQueueForwardOneStep,
  moveQueueToCart,
  sendQueuedNotifications,
} from "$lib/server/shop/addToCart/reservations";
import authorizedPrismaClient from "$lib/server/shop/authorizedPrisma";
import { getCart } from "$lib/server/shop/getTickets";
import purchaseCart, {
  calculateCartPrice,
} from "$lib/server/shop/payments/purchase";
import apiNames from "$lib/utils/apiNames";
import { authorize } from "$lib/utils/authorization";
import {
  passOnTransactionFee,
  priceWithTransactionFee,
  transactionFee,
} from "$lib/utils/payments/transactionFee";
import * as m from "$paraglide/messages";
import { error, fail } from "@sveltejs/kit";
import { message, superValidate } from "sveltekit-superforms/server";
import { z } from "zod";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals, depends }) => {
  const { user, prisma } = locals;
  if (!user?.memberId && !user?.externalCode) {
    throw error(401, "Du har ingen kundvagn.");
  }
  depends("cart");
  authorize(apiNames.WEBSHOP.PURCHASE, user);
  const { inCart, reservations } = await getCart(
    prisma,
    user?.memberId
      ? {
          memberId: user.memberId,
        }
      : {
          externalCode: user.externalCode!,
        },
  );
  const cartPrice = calculateCartPrice(inCart);
  const totalPrice = passOnTransactionFee
    ? priceWithTransactionFee(cartPrice)
    : cartPrice;
  return {
    inCart,
    reservations,
    purchaseForm: await superValidate(purchaseForm),
    totalPrice: totalPrice,
    transactionFee: passOnTransactionFee ? transactionFee(totalPrice) : 0,
  };
};

const purchaseForm = z.object({
  idempotencyKey: z.string(),
});
export type PurchaseForm = typeof purchaseForm;

export const actions = {
  removeItem: async ({ locals, request }) => {
    const { user, prisma } = locals;
    const form = await superValidate(request, z.object({ id: z.string() }));
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
    const form = await superValidate(request, z.object({ id: z.string() }));
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
      if (reservation.order)
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
  purchase: async ({ locals, request }) => {
    const { user, prisma } = locals;
    authorize(apiNames.WEBSHOP.PURCHASE, user);
    const form = await superValidate(request, purchaseForm);
    if (!form.valid) return fail(400, { form });
    if (!user?.memberId && !user?.externalCode) {
      throw error(401, m.cart_errors_noCart());
    }
    try {
      const data = await purchaseCart(
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
      return message(form, data);
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
  },
};
