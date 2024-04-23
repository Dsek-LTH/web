// in src/routes/stripe/webhooks/+server.js
import { SECRET_STRIPE_WEBHOOK_SIGNING } from "$env/static/private";
import stripe from "$lib/server/shop/payments/stripe.js";
import {
  onPaymentCancellation,
  onPaymentFailure,
  onPaymentProcessing,
  onPaymentSuccess,
} from "$lib/server/shop/payments/stripeWebhooks.js";
import { error, json } from "@sveltejs/kit";
import type Stripe from "stripe";

export async function POST({ request }) {
  // extract body
  const body = await request.text();

  // get the signature from the header
  const signature = request.headers.get("stripe-signature");
  if (!signature) throw error(400, "Invalid request");

  // var to hold event data
  let event: Stripe.Event;

  // verify it
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      SECRET_STRIPE_WEBHOOK_SIGNING,
    );
  } catch (err) {
    // signature is invalid!
    console.warn(
      "⚠️  Webhook signature verification failed.",
      (err as Stripe.errors.StripeSignatureVerificationError).message,
    );

    // return, because it's a bad request
    throw error(400, "Invalid request");
  }

  switch (event.type) {
    case "payment_intent.succeeded":
      await onPaymentSuccess(event.data.object);
      return json({ message: "Marked as purchased" });
    case "payment_intent.processing":
      await onPaymentProcessing(event.data.object);
      return json({ message: "Processing logged" });
    case "payment_intent.payment_failed":
      await onPaymentFailure(event.data.object);
      return json({ message: "Marked as failed" });
    case "payment_intent.canceled":
      await onPaymentCancellation(event.data.object);
      return json({ message: "Marked as canceled" });
    default:
      console.log(`Unhandled event type: ${event.type}`);
      throw error(400, "Invalid request");
  }
}
