<script lang="ts">
  import Autocomplete from "$lib/components/Autocomplete.svelte";
  import Input from "$lib/components/Input.svelte";
  import Labeled from "$lib/components/Labeled.svelte";
  import apiNames from "$lib/utils/apiNames";
  import dompurify from "isomorphic-dompurify";
  const { sanitize } = dompurify;
  import { superForm } from "sveltekit-superforms/client";

  import type { PageData } from "./$types";
  export let data: PageData;

  const {
    form,
    errors,
    constraints,
    enhance: updateEnhance,
  } = superForm(data.updateForm);

  let removeModal: HTMLDialogElement | undefined = undefined;
</script>

<svelte:head>
  <title>{data.song.title} | D-sektionen</title>
  <meta name="description" content={data.song.lyrics} />
</svelte:head>

<form
  method="POST"
  action="?/update"
  class="form-control gap-2"
  use:updateEnhance
>
  <input type="hidden" name="id" value={data.song.id} />
  <Input
    name="title"
    label="Titel"
    bind:value={$form.title}
    {...$constraints.title}
    error={$errors.title}
  />
  <Labeled
    label="Melodi"
    id="melody"
    error={$errors.melody}
    explanation="Sök efter en melodi eller skriv in en ny"
  >
    <Autocomplete
      name="melody"
      bind:value={$form.melody}
      options={data.existingMelodies}
      {...$constraints.melody}
      error={$errors.melody}
      searchValue={data.song.melody ?? ""}
    />
  </Labeled>
  <Labeled
    label="Kategori"
    id="category"
    error={$errors.category}
    explanation="Sök efter en kategori eller skriv in en ny"
  >
    <Autocomplete
      name="category"
      bind:value={$form.category}
      options={data.existingCategories}
      {...$constraints.category}
      error={$errors.category}
      searchValue={data.song.category ?? ""}
    />
  </Labeled>
  <Labeled label="Text" id="lyrics" error={$errors.lyrics}>
    <textarea
      id="lyrics"
      name="lyrics"
      class="textarea textarea-bordered h-80"
      bind:value={$form.lyrics}
      {...$constraints.lyrics}
    />
  </Labeled>

  <div class="flex justify-between">
    <div class="flex gap-2">
      <button class="btn btn-primary" type="submit">Spara</button>
      <a class="btn" type="button" href={`/songbook/${data.song.slug}`}>
        Avbryt
      </a>
    </div>
    {#if data.accessPolicies.includes(apiNames.SONG.DELETE)}
      {#if data.song.deletedAt === null}
        <button
          class="btn"
          type="button"
          on:click={() => removeModal?.showModal()}
        >
          Ta bort sång
        </button>
      {:else}
        <form method="POST" action="?/restore" class="form-control gap-2">
          <input type="hidden" name="id" value={data.song.id} />
          <button class="btn" type="submit" formaction="?/restore">
            Återställ från papperskorgen
          </button>
        </form>
      {/if}
    {/if}
  </div>
</form>

<dialog bind:this={removeModal} class="modal modal-bottom sm:modal-middle">
  <div class="modal-box">
    <h3 class="text-lg font-bold">Ta bort sång</h3>
    <p class="py-4">
      Är du säker på att du vill ta bort sången
      <!-- eslint-disable-next-line svelte/no-at-html-tags -- Sanitized client-side -->
      <b class="capitalize">{@html sanitize(data.song.title)}</b>?
    </p>
    <div class="modal-action">
      <form method="POST" action="?/delete" class="form-control gap-2">
        <input type="hidden" name="id" value={data.song.id} />
        <div class="flex gap-2">
          <button
            class="btn"
            type="button"
            on:click={() => removeModal?.close()}
          >
            Avbryt
          </button>
          <button class="btn btn-error" type="submit" formaction="?/delete">
            Ta bort
          </button>
        </div>
      </form>
    </div>
  </div>
  <form method="dialog" class="modal-backdrop">
    <button class="cursor-auto"></button>
  </form>
</dialog>
