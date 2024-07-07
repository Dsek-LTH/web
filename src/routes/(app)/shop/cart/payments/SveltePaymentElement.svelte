<script lang="ts">
  import { page } from "$app/stores";
  import Price from "$lib/components/Price.svelte";
  import { toast } from "$lib/stores/toast";
  import { getFullName } from "$lib/utils/client/member";
  import { APP_REDIRECT_URL, goto } from "$lib/utils/redirect";
  import * as m from "$paraglide/messages";
  import type StripeJS from "@stripe/stripe-js";
  import { Elements, PaymentElement } from "svelte-stripe";

  export let stripe: StripeJS.Stripe | null;
  export let clientSecret: string;
  export let price: number;
  $: redirectUrl =
    ($page.data.isApp ? $page.url.origin + "/" : APP_REDIRECT_URL) +
    "shop/success";

  $: member = $page.data.member;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- The lib we use for display the elements uses an older version of stripe. It works but has the wrong type
  let elements: any;

  let isProcessing = false;
  let paymentError: string | null = null;
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
    // payment failed, notify user
    if (error) {
      if (error?.message) paymentError = error.message;
    } else {
      switch (paymentIntent.status) {
        case "succeeded":
          goto(`/shop/success?payment_intent=${paymentIntent.id}`);
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
  $: untypedStripe = stripe as any;
</script>

{#if stripe}
  <Elements
    stripe={untypedStripe}
    {clientSecret}
    bind:elements
    theme="night"
    variables={{
      colorPrimary: "#f280a1",
    }}
  >
    <form on:submit|preventDefault={handleSubmit}>
      <PaymentElement
        options={{
          layout: "tabs",
          paymentMethodOrder: ["swish", "klarna", "paypal", "card"],
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
