<script lang="ts">
  import { enhance } from "$app/forms";
  import Input from "$lib/components/Input.svelte";
  import Labeled from "$lib/components/Labeled.svelte";
  export let form;
  let name = String(form?.data?.name ?? "");
  let files: FileList | undefined = undefined;
</script>

<form
  id="upload-file"
  class="form-control items-stretch"
  method="POST"
  enctype="multipart/form-data"
  use:enhance
>
  <Labeled label="Year" id="year">
    <input
      id="year"
      name="year"
      class="input input-bordered"
      type="number"
      placeholder="Year"
      required
      value={form?.data?.year ?? new Date().getFullYear()}
    />
  </Labeled>

  <Labeled label="Meeting" id="meeting">
    <input
      id="meeting"
      name="meeting"
      class="input input-bordered"
      value={form?.data?.meeting ?? ""}
      type="text"
      placeholder="S18, HTM1, VTM-extra..."
      required
    />
  </Labeled>
  <Labeled label="Fil" id="file">
    <input
      id="file"
      type="file"
      name="files"
      class="file-input file-input-bordered"
      accept=".pdf,.doc,.jpg,audio/*,video/*,image/*,.txt,.log,.zip"
      required
      bind:files
      on:change={() => {
        name = files?.[0]?.name.replace(/_+/g, " ").replace(/\..+$/, "") ?? "";
      }}
    />
  </Labeled>
  <Input label="Namn" name="name" bind:value={name} required />
  <button type="submit" form="upload-file" class="btn btn-primary mt-8">Ladda upp</button>
</form>
{#if form?.error}
  <p class="text-error">{form.error}</p>
{/if}
{#if form?.success}
  <p class="text-success">Uploaded file successfully!</p>
{/if}
