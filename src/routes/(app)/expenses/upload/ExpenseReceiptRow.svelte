<script lang="ts">
  import FormInput from "$lib/components/forms/FormInput.svelte";
  import FormNumberInput from "$lib/components/forms/FormNumberInput.svelte";
  import FormSelect from "$lib/components/forms/FormSelect.svelte";
  import type { SuperForm } from "sveltekit-superforms";
  import { COST_CENTERS } from "../config";
  import type { ExpenseSchema } from "../types";
  import * as m from "$paraglide/messages";

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
    label={m.expense_type()}
    {options}
  />
  <FormNumberInput
    {superform}
    label={m.expense_amount()}
    step="0.01"
    field={`receipts[${receiptIndex}].rows[${index}].amount`}
  />
  <FormInput
    {superform}
    label={m.receipt_comment()}
    field={`receipts[${receiptIndex}].rows[${index}].comment`}
  />
  {#if onRemove}
    <button type="button" class="btn btn-error" on:click={onRemove}> X </button>
  {/if}
</div>
