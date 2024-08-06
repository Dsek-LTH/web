<script lang="ts">
  import { page } from "$app/stores";
  import FormFileInput from "$lib/components/forms/FormFileInput.svelte";
  import FormInput from "$lib/components/forms/FormInput.svelte";
  import FormSubmitButton from "$lib/components/forms/FormSubmitButton.svelte";
  import apiNames from "$lib/utils/apiNames";
  import { isAuthorized } from "$lib/utils/authorization";
  import * as m from "$paraglide/messages";
  import type { SuperValidated } from "sveltekit-superforms";
  import { zodClient } from "sveltekit-superforms/adapters";
  import { superForm } from "sveltekit-superforms/client";
  import { updateSchema, type UpdateSchema } from "./types";

  let formData: SuperValidated<UpdateSchema>;
  export { formData as form };
  export let open = false;

  const superform = superForm(formData, {
    validators: zodClient(updateSchema),
  });
  const { enhance } = superform;
</script>

{#if open && isAuthorized(apiNames.COMMITTEE.UPDATE, $page.data.user)}
  <form
    action="?/update"
    method="POST"
    use:enhance
    class="form-control"
    enctype="multipart/form-data"
  >
    <FormInput {superform} label={m.committees_name()} field="name" />
    <FormInput
      {superform}
      label={m.committees_description()}
      field="description"
      rows={3}
    />
    <FormInput
      {superform}
      field="lightImageUrl"
      label={m.committees_committeeImage_light()}
      explanation="Large image which will be used on light backgrounds"
    />
    <FormInput
      {superform}
      field="darkImageUrl"
      label={m.committees_committeeImage_dark()}
      explanation="Large image which will be used on dark backgrounds"
    />
    <FormInput
      {superform}
      field="monoImageUrl"
      label={m.committees_committeeImage_mobo()}
      explanation="Large image which will be used when a single color is preferred"
    />
    <FormInput
      {superform}
      field="symbolUrl"
      label={m.committees_committeeImage_symbol()}
      explanation="Small image which will be used as a symbol"
    />
    <FormSubmitButton {superform} class="btn btn-secondary my-4"
      >{m.committees_save()}</FormSubmitButton
    >
  </form>
{/if}
