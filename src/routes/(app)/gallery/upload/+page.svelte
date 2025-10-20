<script lang="ts">
  import Labeled from "$lib/components/Labeled.svelte";
  import { type SuperForm } from "sveltekit-superforms/client";
  import { superForm } from "$lib/utils/client/superForms";
  import type { PageProps } from "./$types";
  import * as m from "$paraglide/messages";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import { zodClient } from "sveltekit-superforms/adapters";
  import { uploadSchema, type UploadSchema } from "./types";

  let { data }: PageProps = $props();

  const { form, constraints, errors, enhance } = superForm(data.form, {
    onResult: (event) => {
      if (event.result.type === "success") {
        // On successful upload, set files to undefined and clear the filename
        fileInput.value = "";
      }
    },
    resetForm: false,
    validators: zodClient(uploadSchema),
  }) as SuperForm<UploadSchema>;
  let fileInput: HTMLInputElement;

  let fileErrors = $derived($errors.files as string | string[] | undefined);
</script>

<SetPageTitle title={m.gallery_uploadAlbum()} />
<a href="/gallery" class="btn btn-outline btn-sm my-2">{m.gallery_back()}</a>
<h1 class="text-2xl font-bold">{m.gallery_uploadAlbum()}</h1>
<form
  id="upload-album"
  class="form-control items-stretch gap-4"
  method="POST"
  enctype="multipart/form-data"
  use:enhance
>
  <Labeled error={$errors.date}>
    <label class="mb-1 text-lg font-medium" for="date"
      >{m.gallery_upload_date()}</label
    >
    <input
      id="date"
      name="date"
      class="input input-bordered"
      bind:value={$form.date}
      type="text"
      placeholder="2025-01-01"
      {...$constraints.date}
    />
  </Labeled>

  <Labeled error={$errors.name}>
    <label class="mb-1 text-lg font-medium" for="name"
      >{m.gallery_upload_name()}</label
    >
    <input
      id="name"
      name="name"
      class="input input-bordered"
      bind:value={$form.name}
      type="text"
      placeholder="Nollefredagen"
      {...$constraints.name}
    />
  </Labeled>

  <Labeled error={fileErrors}>
    <label class="mb-1 text-lg font-medium" for="files">
      {m.gallery_upload_files()}
    </label>
    <input
      bind:this={fileInput}
      id="files"
      type="file"
      multiple
      name="files"
      class="file-input file-input-bordered"
      {...$constraints.files}
    />
  </Labeled>

  <button type="submit" form="upload-album" class="btn btn-primary">
    {m.gallery_upload_upload()}
  </button>
</form>
