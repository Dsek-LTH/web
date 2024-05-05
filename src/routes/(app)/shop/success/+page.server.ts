import { ensurePaymentIntentState } from "$lib/server/shop/payments/stripeMethods";
import { redirect } from "$lib/utils/redirect";
import * as m from "$paraglide/messages";
import type { PageServerLoad } from "./$types";
import { error } from "@sveltejs/kit";

// url example: /shop/success?intentId&payment_intent=pi_3P8jPeCRGoJdzifb0XON4FJl&payment_intent_client_secret=pi_...x&redirect_status=succeeded
export const load: PageServerLoad = async (request) => {
  const { url } = request;
  // query params
  const payment_intent = url.searchParams.get("payment_intent");
  if (!payment_intent) {
    error(404, "Missing payment intent");
  }

  const [intent] = await ensurePaymentIntentState(payment_intent);
  if (intent.status === "succeeded") {
    redirect(
      "/shop/inventory",
      {
        message: m.cart_payment_success(),
        type: "success",
      },
      request,
    );
  }
  switch (intent.status) {
    case "canceled":
      return {
        message: m.cart_payment_canceled(),
      };
    case "processing":
      return {
        message: m.cart_payment_processing(),
      };
    case "requires_action":
      return {
        message: m.cart_payment_requiresAction(),
      };
    default:
      return {
        message: m.cart_payment_failed(),
      };
  }
};
