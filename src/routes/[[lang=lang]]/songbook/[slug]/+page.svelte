<script lang="ts">
  import apiNames from "$lib/utils/apiNames";
  import { superForm } from "sveltekit-superforms/client";
  import Disclaimer from "../Disclaimer.svelte";
  import SongElement from "../SongElement.svelte";
  import Labeled from "$lib/components/Labeled.svelte";
  import AutoCompleteSelector from "$lib/components/AutoCompleteSelector.svelte";
  import Input from "$lib/components/Input.svelte";

  export let data;
  let isEditing = false;

  const {
    form: updateForm,
    errors,
    constraints,
    enhance: updateEnhance,
  } = superForm(data.updateForm);
</script>

<svelte:head>
  <title>{data.song.title} | D-sektionen</title>
  <meta name="description" content={data.song.lyrics} />
</svelte:head>

<div class="flex justify-between">
  <button
    class="btn btn-secondary w-fit"
    on:click={() => (isEditing = !isEditing)}
  >
    {isEditing ? "Sluta redigera" : "Redigera"}
  </button>
  {#if isEditing && data.accessPolicies.includes(apiNames.SONG.DELETE)}
    <div class="flex flex-col items-end">
      {#if data.song.deletedAt === null}
        <form method="POST" action="?/delete" class="form-control gap-2">
          <input type="hidden" name="id" value={data.song.id} />
          <button
            class="btn btn-error w-fit"
            type="submit"
            formaction="?/delete"
          >
            Ta bort sång
          </button>
        </form>
        <p class="w-48 text-sm text-gray-400">
          Sången kommer att markeras som borttagen, men går att återställa
        </p>
      {:else}
        <form method="POST" action="?/restore" class="form-control gap-2">
          <input type="hidden" name="id" value={data.song.id} />
          <button
            class="btn btn-success w-fit"
            type="submit"
            formaction="?/restore"
          >
            Återställ sången till arkivet
          </button>
        </form>
      {/if}
    </div>
  {/if}
</div>

{#if isEditing && data.accessPolicies.includes(apiNames.SONG.UPDATE)}
  <form
    method="POST"
    action="?/update"
    class="form-control gap-2"
    use:updateEnhance
    on:submit={() => (isEditing = false)}
  >
    <input type="hidden" name="id" value={data.song.id} />
    <Input
      name="title"
      label="Titel"
      bind:value={$updateForm.title}
      {...$constraints.title}
      error={$errors.title}
    />
    <Labeled label="Melodi" id="melody" error={$errors.melody}>
      <p class="text-sm text-gray-400">
        Sök efter en melodi eller skriv in en ny
      </p>
      <AutoCompleteSelector
        name="melody"
        bind:value={$updateForm.melody}
        allItems={data.existingMelodies}
        {...$constraints.melody}
        error={$errors.melody}
        searchValue={data.song.melody ?? ""}
      />
    </Labeled>
    <Labeled label="Kategori" id="category" error={$errors.category}>
      <p class="text-sm text-gray-400">
        Sök efter en kategori eller skriv in en ny
      </p>
      <AutoCompleteSelector
        name="category"
        bind:value={$updateForm.category}
        allItems={data.existingCategories}
        {...$constraints.category}
        error={$errors.category}
        searchValue={data.song.category ?? ""}
      />
    </Labeled>
    <Labeled label="Text" id="lyrics" error={$errors.lyrics}>
      <textarea
        id="lyrics"
        name="lyrics"
        class="textarea textarea-bordered h-96"
        bind:value={$updateForm.lyrics}
        {...$constraints.lyrics}
      />
    </Labeled>
    <button class="btn btn-success mt-4 w-fit" type="submit"> Spara </button>
  </form>
{/if}

<SongElement song={data.song} accessPolicies={data.accessPolicies} />

<Disclaimer />
