<script lang="ts">
  import { env } from "$env/dynamic/public";
  import Price from "$lib/components/Price.svelte";
  import * as m from "$paraglide/messages";
  import type StripeJS from "@stripe/stripe-js";
  import { loadStripe } from "@stripe/stripe-js";
  import { onMount } from "svelte";
  import type { SuperValidated } from "sveltekit-superforms";
  import { superForm } from "sveltekit-superforms/client";
  import type { PurchaseForm } from "../+page.server";
  import SveltePaymentElement from "./SveltePaymentElement.svelte";

  export let totalPrice: number;
  export let showPrice = true;

  let stripe: StripeJS.Stripe | null = null;
  onMount(async () => {
    stripe = await loadStripe(env.PUBLIC_STRIPE_KEY);
  });

  const idempotencyKey = crypto.randomUUID();

  export let purchaseForm: SuperValidated<PurchaseForm>;
  const { enhance, message, submitting } = superForm(purchaseForm);
</script>

{#if $message?.["clientSecret"] !== undefined}
  <tr>
    <td colspan="3" class="w-full max-w-xl">
      <SveltePaymentElement
        {stripe}
        clientSecret={$message["clientSecret"]}
        price={totalPrice}
      />
    </td>
  </tr>
{:else}
  <tr>
    <td>
      <form method="POST" action="?/purchase" use:enhance>
        <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
        <button type="submit" class="btn btn-primary" disabled={$submitting}>
          {#if $submitting}
            {m.cart_processing()}
          {:else}
            {totalPrice === 0 ? m.cart_get() : m.cart_pay()}
          {/if}
        </button>
      </form>
    </td>
    {#if showPrice}
      <td colspan="2" class="text-right">
        <Price price={totalPrice} />
      </td>
    {/if}
  </tr>
{/if}
