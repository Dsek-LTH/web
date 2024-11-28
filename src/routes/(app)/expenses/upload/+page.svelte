<script lang="ts">
  import FormCheckbox from "$lib/components/forms/FormCheckbox.svelte";
  import FormDateInput from "$lib/components/forms/FormDateInput.svelte";
  import FormInput from "$lib/components/forms/FormInput.svelte";
  import PageHeader from "$lib/components/nav/PageHeader.svelte";
  import { superForm } from "$lib/utils/client/superForms";
  import { zodClient } from "sveltekit-superforms/adapters";
  import ExpenseItemForm from "./ExpenseReceiptsForm.svelte";
  import { expenseSchema } from "../types";

  export let data;
  const superform = superForm(data.form, {
    dataType: "json",
    validators: zodClient(expenseSchema),
  });
  const { enhance } = superform;
</script>

<PageHeader title="Ladda upp kvitto" />
<form
  method="POST"
  class="form-control space-y-4"
  use:enhance
  enctype="multipart/form-data"
>
  <div class="flex gap-4">
    <FormDateInput {superform} label="Datum på kvitto" field="date" onlyDate />

    <!-- todo, change to switch -->
    <FormCheckbox
      {superform}
      label="Är sektionskort?"
      field="isGuildCard"
      class="checkbox-lg"
    />
  </div>
  <FormInput
    {superform}
    field="description"
    label="Beskrivning"
    placeholder="Mat till pub..."
  />
  <ExpenseItemForm {superform} />
  <button type="submit" class="btn btn-primary">Skapa</button>
</form>
