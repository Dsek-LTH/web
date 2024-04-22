<script lang="ts">
  import { PUBLIC_STRIPE_KEY } from "$env/static/public";
  import type StripeJS from "@stripe/stripe-js";
  import { loadStripe } from "@stripe/stripe-js";
  import { onMount } from "svelte";
  import type { SuperValidated } from "sveltekit-superforms";
  import { superForm } from "sveltekit-superforms/client";
  import type { PurchaseForm } from "./+page.server";
  import SveltePaymentElement from "./SveltePaymentElement.svelte";

  export let totalPrice: number;

  let stripe: StripeJS.Stripe | null = null;
  onMount(async () => {
    stripe = await loadStripe(PUBLIC_STRIPE_KEY);
  });

  const idempotencyKey = crypto.randomUUID();

  export let purchaseForm: SuperValidated<PurchaseForm>;
  const { enhance, message, submitting } = superForm(purchaseForm);
</script>

{#if $message?.["clientSecret"] !== undefined}
  <section class="max-w-xl">
    <SveltePaymentElement {stripe} clientSecret={$message["clientSecret"]} />
  </section>
{:else}
  <form
    method="POST"
    action="?/purchase"
    use:enhance
    class="flex flex-col items-start gap-2"
  >
    <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
    <span class="font-semibold text-success">{totalPrice / 100} SEK</span>
    <button type="submit" class="btn btn-primary" disabled={$submitting}>
      {#if $submitting}
        Processar...
      {:else}
        {totalPrice === 0 ? "Skaffa" : "Betala"}
      {/if}
    </button>
  </form>
{/if}
