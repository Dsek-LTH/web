import { ensurePaymentIntentState } from "$lib/server/shop/payments/stripeMethods";
import { redirect } from "sveltekit-flash-message/server";
import type { PageServerLoad } from "./$types";
import { error } from "@sveltejs/kit";

// url example: /shop/success?intentId&payment_intent=pi_3P8jPeCRGoJdzifb0XON4FJl&payment_intent_client_secret=pi_3P8jPeCRGoJdzifb0XON4FJl_secret_xxE98jdy5Yx5NthlInQigCV2x&redirect_status=succeeded
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
        message: "Köp genomfört!",
        type: "success",
      },
      request,
    );
  }
  switch (intent.status) {
    case "canceled":
      return {
        message: "Betalningen avbröts",
      };
    case "processing":
      return {
        message: "Betalningen behandlas",
      };
    case "requires_action":
      return {
        message: "Betalningen kräver en åtgärd av dig",
      };
    default:
      return {
        message: "Betalning gick inte igenom, försök igen.",
      };
  }
};
