import {
  removeExpiredConsumables,
  withHandledNotificationQueue,
} from "$lib/server/shop/addToCart/reservations";
import { obtainStripeCustomer } from "$lib/server/shop/payments/customer";
import {
  priceWithTransactionFee,
  passOnTransactionFee,
} from "$lib/utils/payments/transactionFee";
import { getFullName } from "$lib/utils/client/member";
import {
  ShoppableType,
  type ItemQuestionResponse,
  type PrismaClient,
  type Shoppable,
} from "@prisma/client";
import type Stripe from "stripe";
import * as m from "$paraglide/messages";
import authorizedPrismaClient from "$lib/server/authorizedPrisma";
import { dbIdentification, type ShopIdentification } from "../types";
import {
  createPaymentIntent,
  creteConsumableMetadata,
  ensurePaymentIntentState,
  removePaymentIntent,
  updatePaymentIntent,
} from "./stripeMethods";
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
            soldOutReservations[0]?.shoppable?.title ?? "Biljett"
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
  prisma: PrismaClient,
  identification: ShopIdentification,
  idempotencyKey: string,
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

  let didUpdateAlreadyPaidFor = false;
  const existingPaymentIntents: Record<string, Stripe.PaymentIntent> = {};
  for (const consumable of userConsumables) {
    if (consumable.stripeIntentId) {
      const [intent, canRetryPayment] = await ensurePaymentIntentState(
        consumable.stripeIntentId,
      );
      if (intent.status === "succeeded") didUpdateAlreadyPaidFor = true;
      else if (!canRetryPayment)
        await removePaymentIntent(consumable.stripeIntentId);
      else existingPaymentIntents[intent.id] = intent;
    }
  }
  if (didUpdateAlreadyPaidFor) {
    return {
      message: m.tickets_purchase_alreadyPaidFor(),
      type: "success",
      redirect: "inventory",
    };
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

  // Step 3: Calculate price
  const price = calculateCartPrice(userConsumables);
  if (price <= 0) {
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
  }

  const member = identification.memberId
    ? await prisma.member.findUnique({
        where: {
          id: identification.memberId,
        },
      })
    : null;
  const customer = member ? await obtainStripeCustomer(member) : null;

  let intent: Stripe.PaymentIntent;
  // check if multiple different payment intents exists, remove all but one in that case
  const existingIntentIds = Object.keys(existingPaymentIntents);
  const options = {
    amount: passOnTransactionFee ? priceWithTransactionFee(price) : price,
    customer: customer?.id ?? undefined,
    metadata: {
      isAnonymousUser: !member ? "true" : "false", // metadata can only be string or number
      customerStudentId: member ? member.studentId : null,
      customerName: member
        ? getFullName({
            ...member,
            nickname: null,
          })
        : null,
      ...creteConsumableMetadata(userConsumables),
    },
  };
  if (existingIntentIds.length > 0) {
    const intentId = existingIntentIds[0]!;
    if (existingIntentIds.length > 1) {
      await Promise.all(
        existingIntentIds
          .filter((id) => id !== intentId)
          .map((id) => removePaymentIntent(id)),
      );
    }
    intent = await updatePaymentIntent(intentId, {
      ...options,
    });
  } else {
    // Step 4: Create a new stripe payment intent
    intent = await createPaymentIntent({
      ...options,
      idempotencyKey: idempotencyKey, // makes sure if user presses button twice, only one payment intent is created
    }).catch((err) => {
      console.error(err);
      throw new Error(m.tickets_purchase_errors_unableToCreatePaymentIntent());
    });
  }
  try {
    // there is a race condition error here. If two calls to this method are done simultaneously, both will succeed, but one will be overwritten by another. COuld lead to an intent not connected to a consumable.
    await authorizedPrismaClient.$transaction(async (tx): Promise<void> => {
      // ensure all of the consumables are still without a stripeIntentId, and not removed
      const consumables = await tx.consumable.findMany({
        where: {
          id: {
            in: userConsumables.map((c) => c.id),
          },
          OR: [
            {
              stripeIntentId: null,
            },
            {
              stripeIntentId: {
                equals: intent.id, // it's fine if its the same (might be due to idempotencyKey)
              },
            },
          ],
        },
      });
      if (consumables.length !== userConsumables.length) {
        throw new Error(m.tickets_purchase_errors_multipleActivePayments());
      }
      const results = await Promise.allSettled(
        userConsumables.map((consumable) =>
          tx.consumable.update({
            where: {
              id: consumable.id,
            },
            data: {
              stripeIntentId: intent.id,
              priceAtPurchase: calculateConsumablePrice(consumable),
            },
          }),
        ),
      );
      if (results.some((result) => result.status === "rejected")) {
        throw new Error(m.tickets_purchase_errors_couldNotSaveIntentID());
      }
    });
  } catch (err) {
    await removePaymentIntent(intent.id);
    throw err;
  }
  return {
    clientSecret: intent.client_secret,
    message: m.tickets_purchase_readyToPurchase(),
    type: "hidden",
  };
};

type ConsumableFieldsForPrice = {
  shoppable: Pick<Shoppable, "price">;
  questionResponses: Array<Pick<ItemQuestionResponse, "extraPrice">>;
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
