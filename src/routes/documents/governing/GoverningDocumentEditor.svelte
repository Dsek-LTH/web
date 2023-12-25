<script lang="ts">
  import Input from "$lib/components/Input.svelte";
  import type { SuperValidated } from "sveltekit-superforms";
  import { superForm } from "sveltekit-superforms/client";
  import type { GoverningDocumentSchema } from "./schemas";

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
    {isCreating ? "Skapa nytt" : "Redigera"} styrdokument
  </h1>
  <Input
    name="title"
    label="Titel"
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
        placeholder="Pathname"
        bind:value={$form.url}
        {...$constraints.url}
      />
      <p class="text-xs">
        example: reglemente/releases/download/latest/reglemente.pdf
      </p>
    </div>
  </div>
  {#if $errors.url}
    <p class="text-error">{$errors.url}</p>
  {/if}
  <select
    id="documentType"
    name="documentType"
    class="max-w select select-bordered w-full"
    bind:value={$form.documentType}
    {...$constraints.documentType}
  >
    <option value="POLICY">Policy</option>
    <option value="GUIDELINE">Riktlinje</option>
  </select>
  {#if $errors.documentType}
    <p class="text-error">{$errors.documentType}</p>
  {/if}
  <button type="submit" class="btn btn-primary btn-sm mt-4">
    {isCreating ? "Skapa" : "Uppdatera"}
  </button>
</form>
