import { resetConsumablesForIntent } from "$lib/server/shop/payments/stripeMethods";
import Stripe from "stripe";
import authorizedPrismaClient from "../authorizedPrisma";

export const onPaymentSuccess = async (intent: Stripe.PaymentIntent) => {
  const updated = await authorizedPrismaClient.consumable.updateMany({
    where: {
      stripeIntentId: intent.id,
    },
    data: {
      purchasedAt: new Date(),
    },
  });
  if (updated.count === 0) {
    await tryToSavePaymentIntent(intent);
  }
  // TODO: Notify user of successful payment
};

export const tryToSavePaymentIntent = async (intent: Stripe.PaymentIntent) => {
  const consumableIds = intent.metadata?.["consumableIds"]?.split(", ");
  if (!consumableIds) {
    console.error(
      `No consumables found for intent ${intent.id}. Metadata was corrupt. Metadata: ${intent.metadata}`,
    );
    throw new Error("No consumables found for intent"); // this is a big issue
  }
  const updated = await authorizedPrismaClient.consumable.updateMany({
    where: {
      id: {
        in: consumableIds,
      },
    },
    data: {
      stripeIntentId: intent.id,
      purchasedAt: new Date(),
    },
  });
  if (updated.count === 0) {
    console.error(
      `No consumables found for intent ${intent.id}. Not found in db.`,
    );
    throw new Error("No consumables found for intent"); // this is the biggest issue
  }
  // we saved it. Nice!
};

export const onPaymentFailure = async (intent: Stripe.PaymentIntent) => {
  const updated = await authorizedPrismaClient.consumable.updateMany({
    where: {
      stripeIntentId: intent.id,
    },
    data: {
      stripeIntentId: null, // remove the intent id
      purchasedAt: null, // make sure the consumable is not marked as purchased
      priceAtPurchase: null,
    },
  });

  if (updated.count === 0) {
    console.error(`No consumables found for intent ${intent.id}`);
    throw new Error("No consumables found for intent"); // this is not as big of an issue
  }
  // TODO: Notify user of payment failure
};

export const onPaymentCancellation = async (intent: Stripe.PaymentIntent) => {
  await resetConsumablesForIntent(intent.id);
  // TODO: Notify user of payment failure
};

export const onPaymentProcessing = (intent: Stripe.PaymentIntent) => {
  // Stripe docs says the following: Send the customer an order confirmation that indicates their payment is pending. For digital goods, you might want to fulfill the order before waiting for payment to complete.
  // https://docs.stripe.com/payments/accept-a-payment?platform=web&ui=elements#web-post-payment
  // I do not think we should do this, as we have the whole queue system etc. A payment should go through all the way before giving them access.
  console.log(`Payment Intent ${intent.id} is processing`);
};
