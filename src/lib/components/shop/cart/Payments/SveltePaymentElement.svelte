<script lang="ts">
  import { preventDefault } from "svelte/legacy";

  import { page } from "$app/state";
  import Price from "$lib/components/Price.svelte";
  import { toast } from "$lib/stores/toast";
  import { getFullName } from "$lib/utils/client/member";
  import { APP_REDIRECT_URL, goto } from "$lib/utils/redirect";
  import * as m from "$paraglide/messages";
  import type StripeJS from "@stripe/stripe-js";
  import { Elements, PaymentElement } from "svelte-stripe";

  interface Props {
    stripe: StripeJS.Stripe | null;
    clientSecret: string;
    price: number;
  }

  let { stripe, clientSecret, price }: Props = $props();
  let redirectPath = $derived(
    page.data["paths"]?.["purchaseRedirect"] ?? "/shop/success",
  );
  let redirectUrl = $derived(
    (page.data.isApp ? APP_REDIRECT_URL : page.url.origin + "/") +
      redirectPath.slice(1),
  );

  let member = $derived(page.data.member);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- The lib we use for display the elements uses an older version of stripe. It works but has the wrong type
  let elements: any = $state();

  let isProcessing = $state(false);
  let paymentError: string | null = $state(null);
  const handleSubmit = async () => {
    // avoid processing duplicates
    if (isProcessing || !stripe || !elements) return;
    isProcessing = true;
    paymentError = null;

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
      confirmParams: {
        return_url: redirectUrl,
      },
    });

    isProcessing = false;
    if (error) {
      // payment failed, notify user
      if (error?.message) paymentError = error.message;
    } else {
      console.log(paymentIntent.status, paymentIntent, redirectPath);
      switch (paymentIntent.status) {
        case "succeeded":
          goto(`${redirectPath}?payment_intent=${paymentIntent.id}`, {
            invalidateAll: true,
          });
          break;
        case "processing":
          isProcessing = true;
          break;
        case "canceled":
          isProcessing = false;
          toast("Payment canceled", "warning");
          break;
        default:
          console.warn("Unknown payment status", paymentIntent.status);
          break;
      }
    }
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- The lib we use for display the elements uses an older version of stripe. It works but has the wrong type
  let untypedStripe = $derived(stripe as any);
</script>

{#if stripe}
  <Elements
    stripe={untypedStripe}
    {clientSecret}
    bind:elements
    theme={page.data.theme === "light" ? "stripe" : "night"}
    variables={{
      colorPrimary: "#f280a1",
    }}
  >
    <form onsubmit={preventDefault(handleSubmit)}>
      <PaymentElement
        options={{
          layout: "tabs",
          defaultValues: member
            ? {
                billingDetails: {
                  name: getFullName({
                    firstName: member.firstName,
                    lastName: member.lastName,
                    nickname: null,
                  }),
                },
              }
            : undefined,
          fields: {
            billingDetails: {
              name: "auto",
              email: "auto",
              phone: "auto",
              address: "auto",
            },
          },
        }}
      />
      <div class="mt-4 flex items-center justify-between gap-2">
        <button class="btn btn-primary" disabled={isProcessing}>
          {#if isProcessing}
            {m.cart_processing()}
          {:else}{m.cart_pay()}
          {/if}
        </button>
        <Price {price} />
      </div>
      {#if paymentError}
        <p class="text-error">{paymentError}</p>
      {/if}
    </form>
  </Elements>
{/if}
