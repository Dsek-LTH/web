import type {
  ExtendedPrisma,
  ExtendedPrismaModel,
} from "$lib/server/extendedPrisma";
import {
  removeExpiredConsumables,
  withHandledNotificationQueue,
} from "$lib/server/shop/addToCart/reservations";
import { ShoppableType } from "@prisma/client";
import * as m from "$paraglide/messages";
import authorizedPrismaClient from "$lib/server/authorizedPrisma";
import { dbIdentification, type ShopIdentification } from "../types";
import { NotificationType } from "$lib/utils/notifications/types";

const clearOutConsumablesAfterSellingOut = async (
  soldOutShoppableIds: string[],
) => {
  await withHandledNotificationQueue(
    authorizedPrismaClient.$transaction(async (tx) => {
      const soldOutConsumables = await tx.consumable.findMany({
        where: {
          shoppableId: {
            in: soldOutShoppableIds,
          },
          purchasedAt: null,
        },
        include: {
          shoppable: true,
        },
      });
      await tx.consumable.deleteMany({
        where: {
          id: {
            in: soldOutConsumables.map((c) => c.id),
          },
        },
      });

      const soldOutReservations = await tx.consumableReservation.findMany({
        where: {
          shoppableId: {
            in: soldOutShoppableIds,
          },
        },
        include: {
          shoppable: true,
        },
      });
      await tx.consumableReservation.deleteMany({
        where: {
          id: {
            in: soldOutReservations.map((r) => r.id),
          },
        },
      });
      const memberIds = soldOutConsumables
        .map((con) => con.memberId)
        .concat(soldOutReservations.map((res) => res.memberId))
        .filter(Boolean) as string[];
      return [
        {
          title: "😢 Slutsålt:(",
          message: `${
            soldOutReservations[0]?.shoppable?.titleSv ?? "Biljett"
          } har blivit slutsåld`,
          memberIds,
          type: NotificationType.PURCHASE_SOLD_OUT,
          link: "/shop/cart",
        },
      ];
    }),
  );
};

const purchaseCart = async (
  prisma: ExtendedPrisma,
  identification: ShopIdentification,
) => {
  const soldOutShoppableIds: string[] = [];
  const now = new Date();

  // Step 1: Get all consumables in the user's cart
  const userConsumables = await prisma.consumable.findMany({
    where: {
      ...dbIdentification(identification),
      purchasedAt: null,
    },
    include: {
      questionResponses: true,
      shoppable: {
        include: {
          questions: {
            where: {
              removedAt: null,
            },
          },
          ticket: true,
          _count: {
            select: {
              consumables: {
                where: {
                  purchasedAt: {
                    not: null,
                  },
                },
              },
            },
          },
        },
      },
    },
  });
  if (userConsumables.length === 0) {
    throw new Error(m.tickets_purchase_errors_cartEmpty());
  }
  // Step 2: Check if the consumables are still available (should not happen but you never know I guess)
  for (const consumable of userConsumables) {
    if (consumable.expiresAt && consumable.expiresAt < now) {
      await withHandledNotificationQueue(
        removeExpiredConsumables(prisma, new Date()).then(
          (res) => res.queuedNotifications,
        ),
      );
      throw new Error(m.tickets_purchase_errors_expiredConsumable());
    }
    if (
      consumable.shoppable.type === ShoppableType.TICKET &&
      consumable.shoppable._count.consumables >=
        (consumable.shoppable.ticket?.stock ?? 0)
    ) {
      soldOutShoppableIds.push(consumable.shoppable.id);
    }
  }
  if (soldOutShoppableIds.length > 0) {
    await clearOutConsumablesAfterSellingOut(soldOutShoppableIds);
    throw new Error(m.tickets_purchase_errors_soldOutDuringPurchase()); // with our reservation system, this shouldn't happen, but it's just a safety measure
  }

  // Check if any consumables are missing an answer
  if (
    userConsumables.some(
      (consumable) =>
        consumable.questionResponses.length <
          consumable.shoppable.questions.length ||
        // check if there is an unanswered question
        consumable.shoppable.questions.some(
          (q) =>
            // check if no response exists for this question
            consumable.questionResponses.some((r) => r.questionId === q.id) ===
            false,
        ),
    )
  ) {
    throw new Error(m.tickets_purchase_errors_missingAnswers());
  }

  // Step 3: Calculate price. Only free carts can be purchased, since we no longer handle payments.
  const price = calculateCartPrice(userConsumables);
  if (price > 0) {
    throw new Error(m.tickets_purchase_errors_paidNotSupported());
  }
  await authorizedPrismaClient.consumable.updateMany({
    where: {
      id: {
        in: userConsumables.map((c) => c.id),
      },
      shoppable: {
        // in case any price is negative we filter by price=0.
        // A product's price should never be negative, but we check just in case.
        // We do not want to give away another product for free accidentally.
        price: 0,
      },
    },
    data: {
      purchasedAt: new Date(),
      priceAtPurchase: 0,
    },
  });
  return {
    message: m.tickets_purchase_freeConsumablesPurchased(),
    type: "success",
    redirect: "inventory",
  };
};

type ConsumableFieldsForPrice = {
  shoppable: Pick<ExtendedPrismaModel<"Shoppable">, "price">;
  questionResponses: Array<
    Pick<ExtendedPrismaModel<"ItemQuestionResponse">, "extraPrice">
  >;
};
export const calculateConsumablePrice = (
  consumable: ConsumableFieldsForPrice,
) =>
  consumable.shoppable.price +
  consumable.questionResponses.reduce((a, c) => a + (c.extraPrice ?? 0), 0);

export const calculateCartPrice = (consumables: ConsumableFieldsForPrice[]) =>
  consumables.reduce(
    (acc, consumable) =>
      acc +
      calculateConsumablePrice({
        shoppable: consumable.shoppable,
        questionResponses: consumable.questionResponses,
      }),
    0,
  );

export default purchaseCart;
