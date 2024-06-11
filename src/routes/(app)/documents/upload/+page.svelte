<script lang="ts">
  import Labeled from "$lib/components/Labeled.svelte";
  import { superForm } from "sveltekit-superforms/client";
  import DocumentTypeSelector from "./DocumentTypeSelector.svelte";
  import type { PageData } from "./$types";
  import * as m from "$paraglide/messages";
  export let data: PageData;
  const { form, constraints, errors, enhance } = superForm(data.form, {
    onResult: (event) => {
      if (event.result.type === "success") {
        // On successful upload, set files to undefined and clear the filename
        // year and meeting is still kept as to easily upload more files for the same meeting
        files = undefined;
        form.update((f) => {
          f.name = "";
          return f;
        });
      }
    },
  });
  let files: FileList | undefined = undefined;
  const setNameInputToFileName = () => {
    form.update((f) => {
      f.name = files?.[0]?.name.replace(/_+/g, " ").replace(/\..+$/, "") ?? "";
      return f;
    });
  };
</script>

<svelte:head>
  <title>{m.documents_uploadDocument()} | D-sektionen</title>
</svelte:head>

<form
  id="upload-file"
  class="form-control items-stretch gap-4"
  method="POST"
  enctype="multipart/form-data"
  use:enhance
>
  <div>
    <p class="mb-5 text-lg font-medium">
      1. {m.documents_chooseDocumentType()}
    </p>
    <DocumentTypeSelector bind:type={$form.type} />
  </div>

  <Labeled error={$errors.folder}>
    <label class="mb-5 text-lg font-medium" for="folder">
      2. {$form.type === "requirement"
        ? m.documents_writePositionName()
        : m.documents_writeMeetingName()}
    </label>
    <input
      id="folder"
      name="folder"
      class="input input-bordered"
      bind:value={$form.folder}
      type="text"
      placeholder={$form.type === "requirement"
        ? "Øverphøs, Aktivitetsanssvarig..."
        : "S18, HTM1, VTM-extra..."}
      {...$constraints.folder}
    />
  </Labeled>

  <Labeled error={$errors.file}>
    <label class="mb-5 text-lg font-medium" for="file">
      3. {m.documents_uploadFile()}
    </label>
    <input
      id="file"
      type="file"
      name="file"
      class="file-input file-input-bordered"
      required
      bind:files
      on:change={setNameInputToFileName}
      {...$constraints.file}
    />
  </Labeled>

  <Labeled error={$errors.name}>
    <label class="mb-5 text-lg font-medium" for="name">
      4. {m.documents_enterDocumentName()}
    </label>
    <input
      id="name"
      name="name"
      class="input input-bordered"
      type="text"
      placeholder="Namn"
      bind:value={$form.name}
      {...$constraints.name}
    />
  </Labeled>

  <Labeled error={$errors.year}>
    <label class="mb-5 text-lg font-medium" for="year"
      >5. {m.documents_pickMeetingYear()}</label
    >
    <input
      id="year"
      name="year"
      class="input input-bordered"
      type="number"
      bind:value={$form.year}
      {...$constraints.year}
    />
  </Labeled>

  {#if $form.type && $form.folder && $form.name}
    <pre
      class="input input-bordered input-disabled">{$form.type}/{$form.year}/{$form.folder}/{$form.name}</pre>
  {/if}

  <button type="submit" form="upload-file" class="btn btn-primary">
    {m.documents_upload()}
  </button>
</form>
