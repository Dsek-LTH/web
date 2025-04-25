<script lang="ts">
  import { env } from "$env/dynamic/public";
  import Price from "$lib/components/Price.svelte";
  import type { PurchaseForm } from "$lib/utils/shop/types";
  import * as m from "$paraglide/messages";
  import type StripeJS from "@stripe/stripe-js";
  import { loadStripe } from "@stripe/stripe-js";
  import { onMount } from "svelte";
  import type { SuperForm } from "sveltekit-superforms";
  import SveltePaymentElement from "./SveltePaymentElement.svelte";

  let stripe: StripeJS.Stripe | null = $state(null);
  onMount(async () => {
    stripe = await loadStripe(env.PUBLIC_STRIPE_KEY);
  });

  const idempotencyKey = crypto.randomUUID();

  interface Props {
    totalPrice: number;
    showPrice?: boolean;
    superform: SuperForm<PurchaseForm>;
  }

  let { totalPrice, showPrice = true, superform }: Props = $props();
  const { enhance, message, submitting } = superform;

  let isPurchasing = $derived($message?.["clientSecret"] !== undefined);
</script>

{#if isPurchasing}
  <tr>
    <td colspan="100" class="w-full max-w-xl">
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
