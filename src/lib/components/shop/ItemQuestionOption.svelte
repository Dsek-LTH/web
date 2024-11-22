<script lang="ts">
  import FormInput from "$lib/components/forms/FormInput.svelte";
  import Labeled from "$lib/components/Labeled.svelte";
  import MonetaryInput from "$lib/components/shop/MonetaryInput.svelte";
  import type { TicketSchema } from "$lib/utils/shop/types";
  import { formFieldProxy, type SuperForm } from "sveltekit-superforms/client";
  export let superform: SuperForm<TicketSchema>;
  export let field: `questions[${number}].options[${number}]`;
  const {
    value: priceValue,
    errors: priceErrors,
    constraints: priceConstraints,
  } = formFieldProxy(superform, `${field}.extraPrice`);
  let extraCost = !!$priceValue;

  export let onRemove: (() => void) | undefined;
</script>

<div class="relative rounded-lg border-[1px] p-2">
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
  {#if extraCost}
    <div class="flex items-end justify-between">
      <Labeled label="Extrapris (SEK)" error={$priceErrors}>
        <MonetaryInput
          class="w-full"
          name="extraPrice"
          bind:value={$priceValue}
          {...$priceConstraints}
        />
      </Labeled>
      <!-- svelte-ignore a11y_consider_explicit_label -->
      <button
        class="btn btn-error tooltip"
        data-tip={"Ta bort extrakostnad"}
        type="button"
        on:click={() => {
          $priceValue = null;
          extraCost = false;
        }}><span class="i-mdi-trash"></span></button
      >
    </div>
  {:else}
    <button
      class="btn self-start"
      type="button"
      on:click={() => {
        $priceValue = 100;
        extraCost = true;
      }}><span class="i-mdi-plus"></span> Extrakostnad</button
    >
  {/if}
  <!-- svelte-ignore a11y_consider_explicit_label -->
  <button
    class="btn btn-circle btn-error btn-sm absolute -right-4 -top-4 z-10 transition-all"
    class:opacity-0={!onRemove}
    on:click={onRemove}
    type="button"
    disabled={!onRemove}><span class="i-mdi-remove"></span></button
  >
</div>
