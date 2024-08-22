<script lang="ts">
  import Input from "$lib/components/Input.svelte";
  import type { SuperValidated } from "sveltekit-superforms";
  import { superForm } from "$lib/utils/client/superForms";
  import type { GoverningDocumentSchema } from "./schemas";
  import * as m from "$paraglide/messages";

  export let isCreating: boolean;
  export let documentId: string | undefined;
  export let data: SuperValidated<GoverningDocumentSchema>;
  const { form, errors, constraints, enhance } = superForm(data);
</script>

<form
  id="governing-document-editor"
  method="POST"
  action={isCreating ? "?/create" : "?/update"}
  use:enhance
  class="flex flex-col gap-3"
>
  <h1 class="text-2xl font-bold">
    {isCreating
      ? m.documents_governing_createNewDocument()
      : m.documents_governing_editDocument()}
  </h1>
  <Input
    name="title"
    label={m.documents_governing_title()}
    required
    bind:value={$form.title}
    error={$errors.title}
    {...$constraints.title}
  />
  <input name="id" type="hidden" value={documentId} />
  <div class="flex gap-2">
    <input
      value="https://github.com/Dsek-LTH/"
      class="input-border input input-ghost w-full max-w-xs"
      type="text"
      disabled
    />
    <div class="flex w-full flex-col">
      <input
        id="url"
        name="url"
        class="input input-bordered w-full"
        type="text"
        placeholder={m.documents_governing_filePath()}
        bind:value={$form.url}
        {...$constraints.url}
      />
      <p class="text-xs">
        {m.documents_governing_example({
          x: "reglemente/releases/download/latest/reglemente.pdf",
        })}
      </p>
    </div>
  </div>
  {#if $errors.url}
    <p class="text-error">{$errors.url}</p>
  {/if}
  <select
    id="type"
    name="type"
    class="max-w select select-bordered w-full"
    bind:value={$form.type}
    {...$constraints.type}
  >
    <option value="POLICY">{m.documents_governing_policy()}</option>
    <option value="GUIDELINE">{m.documents_governing_guideline()}</option>
  </select>
  {#if $errors.type}
    <p class="text-error">{$errors.type}</p>
  {/if}
  <button type="submit" class="btn btn-primary btn-sm mt-4">
    {isCreating
      ? m.documents_governing_create()
      : m.documents_governing_update()}
  </button>
</form>
