<script lang="ts">
  import FormInput from "$lib/components/forms/FormInput.svelte";
  import FormNumberInput from "$lib/components/forms/FormNumberInput.svelte";
  import FormSelect from "$lib/components/forms/FormSelect.svelte";
  import { type SuperForm } from "sveltekit-superforms";
  import { COST_CENTERS } from "../config";
  import type { ExpenseSchema } from "../types";

  export let superform: SuperForm<ExpenseSchema>;
  export let receiptIndex: number;
  export let index: number;
  export let onRemove: (() => void) | undefined;
  const options = [
    { label: "Välj kostnadsställe", value: null },
    ...COST_CENTERS.map((center) => ({
      label: `${center.name} - ${center.description} (${center.example})`,
      value: center.name,
    })),
  ];
</script>

<div class="-mx-4 border-b border-base-100 px-4 py-2">
  <FormSelect
    {superform}
    field={`receipts[${receiptIndex}].rows[${index}].costCenter`}
    label="Kostnadscenter"
    {options}
  />
  <FormNumberInput
    {superform}
    label="Belopp"
    step="0.01"
    field={`receipts[${receiptIndex}].rows[${index}].amount`}
  />
  <FormInput
    {superform}
    label="Kommentar"
    field={`receipts[${receiptIndex}].rows[${index}].comment`}
  />
  {#if onRemove}
    <button type="button" class="btn btn-error" on:click={onRemove}> X </button>
  {/if}
</div>
