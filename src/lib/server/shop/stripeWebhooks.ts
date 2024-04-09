import authorizedPrismaClient from "./authorizedPrisma";
import Stripe from "stripe";

export const onPaymentSuccess = async (intent: Stripe.PaymentIntent) => {
  await authorizedPrismaClient.consumable.updateMany({
    where: {
      stripeIntentId: intent.id,
    },
    data: {
      purchasedAt: new Date(),
    },
  });
  // TODO: Notify user of successful payment
};

export const onPaymentFailure = async (intent: Stripe.PaymentIntent) => {
  await authorizedPrismaClient.consumable.updateMany({
    where: {
      stripeIntentId: intent.id,
    },
    data: {
      purchasedAt: null, // make sure the consumable is not marked as purchased
    },
  });
  // TODO: Notify user of payment failure
};

export const onPaymentProcessing = (intent: Stripe.PaymentIntent) => {
  // Stripe docs says the following: Send the customer an order confirmation that indicates their payment is pending. For digital goods, you might want to fulfill the order before waiting for payment to complete.
  // https://docs.stripe.com/payments/accept-a-payment?platform=web&ui=elements#web-post-payment
  // I do not think we should do this, as we have the whole queue system etc. A payment should go through all the way before giving them access.
  console.log(`Payment Intent ${intent.id} is processing`);
};
