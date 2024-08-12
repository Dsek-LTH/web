import { ensurePaymentIntentState } from "$lib/server/shop/payments/stripeMethods";
import { redirect } from "$lib/utils/redirect";
import * as m from "$paraglide/messages";
import { error, type ServerLoadEvent } from "@sveltejs/kit";

// url example: ?intentId&payment_intent=pi_3P8jPeCRGoJdzifb0XON4FJl&payment_intent_client_secret=pi_...&redirect_status=succeeded
const stripeCallbackLoad =
  (onSuccessRedirect: string) => async (request: ServerLoadEvent) => {
    const { url, depends } = request;

    // query params
    const payment_intent = url.searchParams.get("payment_intent");
    if (!payment_intent) {
      error(404, "Missing payment intent");
    }

    depends("cart-success-page");

    const [intent] = await ensurePaymentIntentState(payment_intent);
    if (intent.status === "succeeded") {
      throw redirect(
        onSuccessRedirect,
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
          refreshPeriodically: true,
        };
      case "requires_action":
        return {
          message: m.cart_payment_requiresAction(),
          refreshPeriodically: true,
        };
      default:
        return {
          message: m.cart_payment_failed(),
        };
    }
  };

export default stripeCallbackLoad;
