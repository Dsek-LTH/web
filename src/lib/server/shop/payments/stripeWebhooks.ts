import { resetConsumablesForIntent } from "$lib/server/shop/payments/stripeMethods";
import Stripe from "stripe";
import authorizedPrismaClient from "../authorizedPrisma";
import sendNotification from "$lib/utils/notifications";
import { NotificationType } from "$lib/utils/notifications/types";
import type { Prisma } from "@prisma/client";

export const onPaymentSuccess = async (intent: Stripe.PaymentIntent) => {
  const purchasedConsumables = await authorizedPrismaClient.$transaction(
    async (tx) => {
      let relevantConsumables = await tx.consumable.findMany({
        where: {
          stripeIntentId: intent.id,
        },
        include: {
          shoppable: true,
        },
      });
      if (relevantConsumables.length === 0) {
        relevantConsumables = await tryToSavePaymentIntent(intent, tx);
      }
      if (
        relevantConsumables.every(
          (consumable) => consumable.purchasedAt !== null,
        )
      ) {
        console.warn(
          "Tried to mark consumables as purchased, but they were already marked as purchased",
        );
      } else {
        if (
          relevantConsumables.some(
            (consumable) => consumable.purchasedAt !== null,
          )
        ) {
          console.warn(
            `some consumables for intent id was already marked as purchased. Intent id: ${intent.id}`,
          );
        }
        await tx.consumable.updateMany({
          where: {
            stripeIntentId: intent.id,
          },
          data: {
            purchasedAt: new Date(),
          },
        });
      }
      return relevantConsumables;
    },
  );
  try {
    await sendNotification({
      title:
        purchasedConsumables.length === 1
          ? `${purchasedConsumables[0]?.shoppable.title} har köpts`
          : `${purchasedConsumables.length} produkter har köpts`,
      message: `Ditt köp på ${intent.amount / 100} ${
        intent.currency?.toUpperCase() ?? "SEK"
      } har gått igenom`,
      type: NotificationType.PAYMENT_STATUS,
      link: "/shop/inventory",
      // From a pure type perspective, there is a risk of this array being multiple memberIds, meaning they might both get "you have purchased 2 items" but only purchased one each
      // But in reality, there is no way for two different people to have the same purchase intent, so it should always be a array of 1 items (or 0, if purchased anonymously)
      memberIds: purchasedConsumables
        .map((consumable) => consumable.memberId)
        .filter(Boolean) as string[],
    });
  } catch (e) {
    throw new Error(
      `Could not send notifications: ${e instanceof Error ? e.message : e}`,
    );
  }
};

export const tryToSavePaymentIntent = async (
  intent: Stripe.PaymentIntent,
  tx: Prisma.TransactionClient,
) => {
  const consumableIds = intent.metadata?.["consumableIds"]?.split(", ");
  if (!consumableIds) {
    console.error(
      `No consumables found for intent ${intent.id}. Metadata was corrupt. Metadata: ${intent.metadata}`,
    );
    throw new Error("No consumables found for intent"); // this is a big issue
  }
  const relevantConsumables = await tx.consumable.findMany({
    where: {
      id: {
        in: consumableIds,
      },
      purchasedAt: null,
    },
    include: {
      shoppable: true,
    },
  });
  if (relevantConsumables.length === 0) {
    console.error(
      `No consumables found for intent ${intent.id}. Not found in db.`,
    );
    throw new Error("No consumables found for intent"); // this is the biggest issue
  }
  await tx.consumable.updateMany({
    where: {
      id: {
        in: consumableIds,
      },
    },
    data: {
      stripeIntentId: intent.id,
    },
  });
  // we saved it. Nice!
  return relevantConsumables;
};

export const onPaymentFailure = async (intent: Stripe.PaymentIntent) => {
  const failedConsumables = await authorizedPrismaClient.$transaction(
    async (tx) => {
      const relevantConsumables = await tx.consumable.findMany({
        where: {
          stripeIntentId: intent.id,
        },
        include: {
          shoppable: true,
        },
      });
      if (relevantConsumables.length === 0) {
        console.error(`No consumables found for intent ${intent.id}`);
        throw new Error("No consumables found for intent"); // this is not as big of an issue
      }
      await tx.consumable.updateMany({
        where: {
          stripeIntentId: intent.id,
        },
        data: {
          stripeIntentId: null, // remove the intent id
          purchasedAt: null, // make sure the consumable is not marked as purchased
          priceAtPurchase: null,
        },
      });
      return relevantConsumables;
    },
  );

  try {
    await sendNotification({
      title: "Ditt köp har misslyckats",
      message: `Ditt köp på ${intent.amount / 100} ${
        intent.currency?.toUpperCase() ?? "SEK"
      } har misslyckats. Anledning: ${intent.last_payment_error?.message}`,
      type: NotificationType.PAYMENT_STATUS,
      link: "/shop/cart",
      // From a pure type perspective, there is a risk of this array being multiple memberIds, meaning they might both get "you have purchased 2 items" but only purchased one each
      // But in reality, there is no way for two different people to have the same purchase intent, so it should always be a array of 1 items (or 0, if purchased anonymously)
      memberIds: failedConsumables
        .map((consumable) => consumable.memberId)
        .filter(Boolean) as string[],
    });
  } catch (e) {
    throw new Error(
      `Could not send notifications: ${e instanceof Error ? e.message : e}`,
    );
  }
};

export const onPaymentCancellation = async (intent: Stripe.PaymentIntent) => {
  await resetConsumablesForIntent(intent.id);

  // Do we want to send a notification here as well?
};

export const onPaymentProcessing = (intent: Stripe.PaymentIntent) => {
  // Stripe docs says the following: Send the customer an order confirmation that indicates their payment is pending. For digital goods, you might want to fulfill the order before waiting for payment to complete.
  // https://docs.stripe.com/payments/accept-a-payment?platform=web&ui=elements#web-post-payment
  // I do not think we should do this, as we have the whole queue system etc. A payment should go through all the way before giving them access.
  console.log(`Payment Intent ${intent.id} is processing`);
};
