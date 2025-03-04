<script lang="ts">
  import FormInput from "$lib/components/forms/FormInput.svelte";
  import { superForm } from "$lib/utils/client/superForms";
  import FormSubmitButton from "$lib/components/forms/FormSubmitButton.svelte";
  import FormNumberInput from "$lib/components/forms/FormNumberInput.svelte";

  export let data;

  const superform = superForm(data.form);
  const { enhance } = superform;
</script>

<form
  method="POST"
  class="layout-container mx-auto flex flex-col gap-2"
  enctype="multipart/form-data"
  use:enhance
>
  <FormInput {superform} field="header" label="Header" />
  <FormInput {superform} field="body" label="Body" />
  <FormNumberInput {superform} field="price" label="Price" />
  <FormInput {superform} field="email" label="Email" />
  <FormInput {superform} field="phone" label="Phone number" />
  <FormSubmitButton {superform} class="btn mt-2"
    >Create Listing</FormSubmitButton
  >
</form>
