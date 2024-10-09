<script lang="ts">
  import Labeled from "$lib/components/Labeled.svelte";
  import MonetaryInput from "$lib/components/shop/MonetaryInput.svelte";
  import type { TicketSchema } from "$lib/utils/shop/types";
  import {
    cardTranscationFee,
    passOnTransactionFee,
    swishTransactionFee,
    transactionFee,
  } from "$lib/utils/payments/transactionFee";
  import { formFieldProxy, type SuperForm } from "sveltekit-superforms/client";

  export let superform: SuperForm<TicketSchema>;
  const { value, errors, constraints } = formFieldProxy(superform, "price");
  $: price = Number($value) * 100;

  const priceToText = (price: number) =>
    new Intl.NumberFormat("sv-SE", {
      style: "currency",
      currency: "SEK",
      currencyDisplay: "code",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price / 100);
</script>

<Labeled label="Biljettpris (SEK)" error={$errors}>
  <div class="flex items-center gap-2">
    <MonetaryInput
      name="price"
      bind:value={$value}
      constraints={$constraints}
    />
    <p class="text-sm text-base-content/60">
      {#if passOnTransactionFee}
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
