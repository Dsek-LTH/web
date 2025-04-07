<script lang="ts">
  import FormCheckbox from "$lib/components/forms/FormCheckbox.svelte";
  import FormDateInput from "$lib/components/forms/FormDateInput.svelte";
  import FormInput from "$lib/components/forms/FormInput.svelte";
  import PageHeader from "$lib/components/nav/PageHeader.svelte";
  import { superForm } from "$lib/utils/client/superForms";
  import { zodClient } from "sveltekit-superforms/adapters";
  import ExpenseItemForm from "./ExpenseReceiptsForm.svelte";
  import { expenseSchema } from "../types";
  import FormSubmitButton from "$lib/components/forms/FormSubmitButton.svelte";
  import * as m from "$paraglide/messages";

  export let data;
  const superform = superForm(data.form, {
    dataType: "json",
    validators: zodClient(expenseSchema),
  });
  const { enhance } = superform;
</script>

<PageHeader title={m.upload_reciept()} />
<form
  method="POST"
  class="form-control space-y-4"
  use:enhance
  enctype="multipart/form-data"
>
  <div class="flex gap-4">
    <FormDateInput {superform} label={m.receipt_date()} field="date" onlyDate />

    <!-- todo, change to switch -->
    <FormCheckbox
      {superform}
      label={m.is_guildCard()}
      field="isGuildCard"
      class="checkbox-lg"
    />
  </div>
  <FormInput
    {superform}
    field="description"
    label={m.expense_description()}
    placeholder={m.pub_example()}
  />
  <ExpenseItemForm {superform} />
  <FormSubmitButton {superform} class="btn btn-primary"
    >{m.create_expense()}</FormSubmitButton
  >
</form>
