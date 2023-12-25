<script lang="ts">
  import Input from "$lib/components/Input.svelte";
  import Labeled from "$lib/components/Labeled.svelte";
  import { superForm } from "sveltekit-superforms/client";
  export let data;
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
  <title>Ladda upp dokument | D-sektionen</title>
</svelte:head>

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
      bind:value={$form.year}
      {...$constraints.year}
    />
  </Labeled>
  {#if $errors.year}
    <p class="text-error">{$errors.year}</p>
  {/if}
  <Labeled label="Meeting" id="meeting">
    <input
      id="meeting"
      name="meeting"
      class="input input-bordered"
      bind:value={$form.meeting}
      type="text"
      placeholder="S18, HTM1, VTM-extra..."
      {...$constraints.meeting}
    />
  </Labeled>
  {#if $errors.meeting}
    <p class="text-error">{$errors.meeting}</p>
  {/if}
  <Labeled label="Fil" id="file">
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
  {#if $errors.file}
    <p class="text-error">{$errors.file}</p>
  {/if}
  <Input
    label="Namn"
    name="name"
    bind:value={$form.name}
    {...$constraints.name}
  />
  {#if $errors.name}
    <p class="text-error">{$errors.name}</p>
  {/if}
  <button type="submit" form="upload-file" class="btn btn-primary mt-8"
    >Ladda upp</button
  >
</form>
