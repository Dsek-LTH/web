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
import {
  QuestionType,
  answerQuestion,
  questionForm,
} from "$lib/server/shop/questions";
import apiNames from "$lib/utils/apiNames";
import { authorize } from "$lib/utils/authorization";
import {
  passOnTransactionFee,
  priceWithTransactionFee,
  transactionFee,
} from "$lib/utils/payments/transactionFee";
import * as m from "$paraglide/messages";
import { error, fail } from "@sveltejs/kit";
import {
  message,
  superValidate,
  type Infer,
} from "sveltekit-superforms/server";
import { zod } from "sveltekit-superforms/adapters";
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
    inCart: await Promise.all(
      inCart.map(async (item) => {
        const questions = item.shoppable.questions;
        const answers = item.questionResponses;
        return {
          ...item,
          questions: await Promise.all(
            questions.map((question) => {
              const answer = answers.find((a) => a.questionId === question.id);
              return superValidate(
                answer
                  ? {
                      consumableId: item.id,
                      questionId: question.id,
                      answer: answer.answer ?? "",
                      optionId:
                        question.type === QuestionType.MultipleChoice
                          ? question.options.find(
                              (option) =>
                                option.answer === answer.answer ||
                                option.answerEn === answer.answer,
                            )?.id ?? null
                          : null,
                    }
                  : undefined,
                zod(questionForm),
              );
            }),
          ),
        };
      }),
    ),
    reservations,
    purchaseForm: await superValidate(zod(purchaseForm)),
    totalPrice: totalPrice,
    transactionFee: passOnTransactionFee ? transactionFee(totalPrice) : 0,
  };
};

const purchaseForm = z.object({
  idempotencyKey: z.string(),
});
export type PurchaseForm = Infer<typeof purchaseForm>;

export const actions = {
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
  purchase: async ({ locals, request }) => {
    const { user, prisma } = locals;
    authorize(apiNames.WEBSHOP.PURCHASE, user);
    const form = await superValidate(request, zod(purchaseForm));
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
