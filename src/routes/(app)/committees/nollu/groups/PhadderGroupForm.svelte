<script lang="ts" generics>
  import FormInput from "$lib/components/forms/FormInput.svelte";
  import FormSelect from "$lib/components/forms/FormSelect.svelte";
  import FormSubmitButton from "$lib/components/forms/FormSubmitButton.svelte";
  import type { PhadderGroupSchema } from "$lib/nollning/groups/types";
  import { superForm } from "$lib/utils/client/superForms";
  import { type FormOptions, type SuperValidated } from "sveltekit-superforms";

  type Schema = Omit<PhadderGroupSchema, "id"> | PhadderGroupSchema;
  interface Props {
    create?: boolean;
    form: SuperValidated<Schema>;
    onResult?: FormOptions<Schema>["onResult"] | undefined;
    start?: import("svelte").Snippet;
  }

  let { create = false, form, onResult = undefined, start }: Props = $props();
  let superform = $derived(
    superForm(form, {
      resetForm: true,
      onResult,
    }),
  );
  let enhance = $derived(superform.enhance);
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
  {@render start?.()}
  <FormInput {superform} field="id" type="hidden" />
  <FormInput {superform} field="name" label="Namn" />
  <FormInput {superform} field="description" label="Beskrivning" />
  <FormSelect {superform} field="year" label="År" options={yearOptions} />
  <FormInput {superform} field="imageUrl" label="Bildlänk" />
  <FormSubmitButton {superform} class="btn btn-primary mt-4 self-start">
    {create ? "Skapa" : "Uppdatera"}
  </FormSubmitButton>
</form>
