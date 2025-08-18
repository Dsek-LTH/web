<script lang="ts" generics>
  import FormInput from "$lib/components/forms/FormInput.svelte";
  import FormSelect from "$lib/components/forms/FormSelect.svelte";
  import FormSubmitButton from "$lib/components/forms/FormSubmitButton.svelte";
  import type { PhadderGroupSchema } from "$lib/nollning/groups/types";
  import { superForm } from "$lib/utils/client/superForms";
  import { type FormOptions, type SuperValidated } from "sveltekit-superforms";

  export let create = false;
  type Schema = Omit<PhadderGroupSchema, "id"> | PhadderGroupSchema;
  export let form: SuperValidated<Schema>;
  export let onResult: FormOptions<Schema>["onResult"] | undefined = undefined;
  $: superform = superForm(form, {
    resetForm: true,
    onResult,
  });
  $: enhance = superform.enhance;
  const yearOptions = Array(new Date().getFullYear() - 1982 + 1)
    .fill(0)
    .map((_, i) => new Date().getFullYear() - i)
    .map((year) => ({
      value: year,
      label: year.toString(),
    }));
</script>

<form
  use:enhance
  action="?/{create ? 'create' : 'update'}"
  method="POST"
  class="form-control"
>
  <slot name="start" />
  <FormInput {superform} field="name" label="Namn" />
  <FormInput {superform} field="description" label="Beskrivning" />
  <FormSelect {superform} field="year" label="År" options={yearOptions} />
  <FormInput {superform} field="imageUrl" label="Bildlänk" />
  <FormSubmitButton {superform} class="btn btn-primary mt-4 self-start">
    {create ? "Skapa" : "Uppdatera"}
  </FormSubmitButton>
</form>
