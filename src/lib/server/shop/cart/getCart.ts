import { type ExtendedPrisma } from "$lib/server/extendedPrisma";
import {
  removeExpiredConsumables,
  withHandledNotificationQueue,
} from "$lib/server/shop/addToCart/reservations";
import { calculateCartPrice } from "$lib/server/shop/payments/purchase";
import {
  dbIdentification,
  GRACE_PERIOD_WINDOW,
  type ShopIdentification,
} from "$lib/server/shop/types";
import apiNames from "$lib/utils/apiNames";
import { authorize } from "$lib/utils/authorization";
import {
  passOnTransactionFee,
  priceWithTransactionFee,
  transactionFee,
} from "$lib/utils/payments/transactionFee";
import { questionForm } from "$lib/utils/shop/types";
import { ShoppableType } from "@prisma/client";
import { error, type ServerLoadEvent } from "@sveltejs/kit";
import { zod4 } from "sveltekit-superforms/adapters";
import { superValidate } from "sveltekit-superforms/server";
import { purchaseForm } from "./types";
import authorizedPrismaClient from "$lib/server/authorizedPrisma";

export const getCart = async (
  prisma: ExtendedPrisma,
  id: ShopIdentification,
) => {
  const now = new Date();
  await withHandledNotificationQueue(
    removeExpiredConsumables(authorizedPrismaClient, now).then(
      (res) => res.queuedNotifications,
    ),
  );
  const inCart = await prisma.consumable.findMany({
    where: {
      ...dbIdentification(id),
      OR: [{ expiresAt: { gt: now } }, { expiresAt: null }],
      purchasedAt: null,
      shoppable: { type: ShoppableType.TICKET },
    },
    include: {
      questionResponses: true,
      shoppable: {
        include: {
          questions: { where: { removedAt: null }, include: { options: true } },
          ticket: {
            include: { event: true },
          },
          _count: {
            select: {
              consumables: {
                where: { purchasedAt: { not: null } },
              },
            },
          },
        },
      },
    },
  });
  const reservations = await prisma.consumableReservation.findMany({
    where: {
      ...dbIdentification(id),
      shoppable: { type: ShoppableType.TICKET },
    },
    include: {
      shoppable: {
        include: {
          ticket: { include: { event: true } },
        },
      },
    },
  });
  return {
    inCart: inCart.map((c) => ({
      ...c,
      shoppable: {
        ...c.shoppable.ticket!,
        ...c.shoppable,
        ticket: undefined,
      },
    })),
    reservations: reservations.map((c) => ({
      ...c,
      shoppable: {
        ...c.shoppable.ticket!,
        ...c.shoppable,
        ticket: undefined,
        gracePeriodEndsAt: new Date(
          c.shoppable.availableFrom.valueOf() + GRACE_PERIOD_WINDOW,
        ),
      },
    })),
  };
};

export const getCartWithExtras = async (
  prisma: ExtendedPrisma,
  identification: ShopIdentification,
) => {
  const { inCart, reservations } = await getCart(prisma, identification);

  const cartPrice = calculateCartPrice(inCart);
  const totalPrice = passOnTransactionFee
    ? priceWithTransactionFee(cartPrice)
    : cartPrice;
  const inCartWithQuestionForms = await Promise.all(
    inCart.map(async (item) => {
      const questions = item.shoppable.questions;
      const answers = item.questionResponses;
      return {
        ...item,
        shoppable: {
          ...item.shoppable,
          questions: await Promise.all(
            questions.map(async (question) => {
              const answer = answers.find((a) => a.questionId === question.id);
              return {
                ...question,
                form: await superValidate(
                  {
                    consumableId: item.id,
                    questionId: question.id,
                    answer: answer?.answer,
                  },
                  zod4(questionForm),
                  {
                    errors: false,
                  },
                ),
              };
            }),
          ),
        },
      };
    }),
  );
  return {
    inCart: inCartWithQuestionForms,
    reservations,
    purchaseForm: await superValidate(zod4(purchaseForm)),
    totalPrice: totalPrice,
    transactionFee: passOnTransactionFee ? transactionFee(totalPrice) : 0,
  };
};

export const cartLoadFunction = async ({
  locals,
  depends,
}: ServerLoadEvent) => {
  const { user, prisma } = locals;
  if (!user?.memberId && !user?.externalCode) {
    throw error(401, "Du har ingen kundvagn.");
  }
  depends("cart");
  authorize(apiNames.WEBSHOP.PURCHASE, user);

  return await getCartWithExtras(
    prisma,
    user?.memberId
      ? {
          memberId: user.memberId,
        }
      : {
          externalCode: user.externalCode!,
        },
  );
};
export type CartLoadData = Awaited<ReturnType<typeof cartLoadFunction>>;

export type CartItem = Awaited<
  ReturnType<typeof getCartWithExtras>
>["inCart"][number];
export type CartReservation = Awaited<
  ReturnType<typeof getCartWithExtras>
>["reservations"][number];
