<script lang="ts">
  import FormInput from "$lib/components/forms/FormInput.svelte";
  import Labeled from "$lib/components/Labeled.svelte";
  import MonetaryInput from "$lib/components/shop/MonetaryInput.svelte";
  import type { TicketSchema } from "$lib/components/shop/types";
  import { formFieldProxy, type SuperForm } from "sveltekit-superforms/client";
  export let superform: SuperForm<TicketSchema>;
  export let field: `questions[${number}].options[${number}]`;
  const {
    value: priceValue,
    errors: priceErrors,
    constraints: priceConstraints,
  } = formFieldProxy(superform, `${field}.extraPrice`);

  export let onRemove: () => void;
</script>

<div>
  <FormInput
    {superform}
    field="{field}.answer"
    label="Svenska"
    placeholder="Svarsalternativ..."
  />
  <FormInput
    {superform}
    field="{field}.answerEn"
    label="Engelska"
    placeholder="Response option..."
  />
  <Labeled label="Extrapris (SEK)" error={$priceErrors}>
    {#if $priceValue}
      <MonetaryInput
        name="extraPrice"
        bind:value={$priceValue}
        {...$priceConstraints}
      />
      <button
        class="btn"
        type="button"
        on:click={() => {
          $priceValue = null;
        }}>Ta bort extrakostnad</button
      >
    {:else}
      <button
        class="btn"
        type="button"
        on:click={() => {
          $priceValue = 0;
        }}>Lägg till extrakostnad</button
      >
    {/if}
  </Labeled>
  <button class="btn" on:click={onRemove} type="button"
    >Ta bort alternativ</button
  >
</div>
