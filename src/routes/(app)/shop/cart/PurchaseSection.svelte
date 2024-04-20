<script lang="ts">
  import { PUBLIC_STRIPE_KEY } from "$env/static/public";
  import type StripeJS from "@stripe/stripe-js";
  import { loadStripe } from "@stripe/stripe-js";
  import { onMount } from "svelte";
  import type { SuperValidated } from "sveltekit-superforms";
  import { superForm } from "sveltekit-superforms/client";
  import type { PurchaseForm } from "./+page.server";
  import SveltePaymentElement from "./SveltePaymentElement.svelte";

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
  <form method="POST" action="?/purchase" use:enhance>
    <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
    <button type="submit" class="btn btn-primary" disabled={$submitting}>
      {$submitting ? "Processar..." : "Betala"}
    </button>
  </form>
{/if}
