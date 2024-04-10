import { onPaymentSuccess } from "$lib/server/shop/payments/stripeWebhooks";
import type { Consumable, Shoppable } from "@prisma/client";
import Stripe from "stripe";
import authorizedPrismaClient from "../authorizedPrisma";
import stripe from "./stripe";

type RequiredProps = "amount" | "metadata" | "customer";
type Props = Pick<Stripe.PaymentIntentCreateParams, RequiredProps> &
  Partial<Omit<Stripe.PaymentIntentCreateParams, RequiredProps>> & {
    idempotencyKey: string;
  };

/**
 * Creates a payment intent for a purchase.
 */
export const createPaymentIntent = ({ idempotencyKey, ...params }: Props) => {
  return stripe.paymentIntents.create(
    {
      currency: "SEK",
      automatic_payment_methods: {
        enabled: true,
      },
      description: "D-sek webshop purchase",
      ...params,
    },
    {
      idempotencyKey: idempotencyKey,
    },
  );
};

export const creteConsumableMetadata = (
  consumables: Array<
    Consumable & {
      shoppable: Shoppable;
    }
  >,
): Stripe.MetadataParam => {
  if (consumables.length == 0) {
    const consumable = consumables[0]!;
    return {
      consumableId: consumable.id,
      consumableName: consumable.shoppable.title,
      consumableCount: 1,
    };
  }
  return {
    consumableIds: consumables.map((c) => c.id).join(", "),
    consumableNames: consumables.map((c) => c.id).join(", "),
    consumableCount: consumables.length,
  };
};

export const getPaymentIntent = (intentId: string) => {
  return stripe.paymentIntents.retrieve(intentId);
};

/**
 * You can cancel a PaymentIntent object when it's in one of these statuses: requires_payment_method, requires_capture, requires_confirmation, requires_action or, in rare cases, processing.

After it's canceled, no additional charges are made by the PaymentIntent and any operations on the PaymentIntent fail with an error. For PaymentIntents with a status of requires_capture, the remaining amount_capturable is automatically refunded.

You can't cancel the PaymentIntent for a Checkout Session. Expire the Checkout Session instead.
 */
export const removePaymentIntent = async (intentId: string) => {
  await stripe.paymentIntents.cancel(intentId);
  await authorizedPrismaClient.consumable.updateMany({
    where: {
      stripeIntentId: intentId,
    },
    data: {
      purchasedAt: null,
      stripeIntentId: null,
    },
  });
};

export const updatePaymentIntent = async (intentId: string) => {
  const intent = await getPaymentIntent(intentId);
  switch (intent.status) {
    case "requires_payment_method":
      // payment intent was started but never finished, or it failed.
      await removePaymentIntent(intent.id);
      break;
    case "requires_action":
      // user is required to confirm with another platform, like SMS or BankID.
      await removePaymentIntent(intent.id);
      break;
    case "requires_capture":
      // only valid if you use the stripe "authorization then capture" workflow, where payment method is authorized, and THEN payment is captured at a later time.
      await removePaymentIntent(intent.id);
      break;
    case "requires_confirmation":
      // a popup whether or not the user want's to confirm the payment has been showed to the user but not confirmed yet.
      await removePaymentIntent(intent.id);
      break;
    case "processing":
      // payment in progress, do not start a new transaction
      throw new Error("Du har redan en pågående betalning.");
    case "canceled":
      // payment was canceled
      await removePaymentIntent(intent.id);
      await authorizedPrismaClient.consumable.updateMany({
        where: {
          stripeIntentId: intentId,
        },
        data: {
          purchasedAt: null,
          stripeIntentId: null,
        },
      });
      break;
    case "succeeded":
      // payment was successful
      await onPaymentSuccess(intent); // mark as successful
      break;
    default:
      // Unknown status. Remove intent
      await removePaymentIntent(intent.id);
      break;
  }
  return intent;
};
