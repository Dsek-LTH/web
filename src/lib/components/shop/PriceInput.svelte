<script lang="ts">
  import Labeled from "$lib/components/Labeled.svelte";
  import type { TicketSchema } from "$lib/components/shop/types";
  import {
    cardTranscationFee,
    shouldPassOnTransactionFee,
    swishTransactionFee,
    transactionFee,
  } from "$lib/utils/payments/transactionFee";
  import type { UnwrapEffects } from "sveltekit-superforms";
  import type { SuperForm } from "sveltekit-superforms/client";

  type Form = SuperForm<UnwrapEffects<TicketSchema>>;
  export let form: Form["form"];
  export let constraints: Form["constraints"];
  export let errors: Form["errors"];
  $: price = Number($form.price) * 100;

  const priceToText = (price: number) =>
    new Intl.NumberFormat("sv-SE", {
      style: "currency",
      currency: "SEK",
      currencyDisplay: "code",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price / 100);
</script>

<Labeled label="Biljettpris (SEK)" error={$errors.price}>
  <div class="flex items-center gap-2">
    <input
      name="price"
      bind:value={$form.price}
      class="input input-bordered w-20 min-w-0 max-w-40 shrink grow"
      {...$constraints.price}
      step="0.01"
      type="number"
    />
    <p class="text-sm text-base-content/60">
      {#if shouldPassOnTransactionFee}
        Transaktionsavgift läggs på i kundvagn.
      {:else}
        ~{priceToText(price - transactionFee(price))} fås <br />
        (Swish: {priceToText(swishTransactionFee(price))}, Kort: {priceToText(
          cardTranscationFee(price),
        )})
      {/if}
    </p>
  </div>
</Labeled>
