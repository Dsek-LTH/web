<script lang="ts">
  import apiNames from "$lib/utils/apiNames";
  import { superForm } from "sveltekit-superforms/client";
  import Disclaimer from "../Disclaimer.svelte";
  import SongElement from "../SongElement.svelte";
  import Labeled from "$lib/components/Labeled.svelte";
  import FuzzySelector from "../upload/FuzzySelector.svelte";

  export let data;
  let isEditing = false;

  const { form, errors, constraints, enhance } = superForm(data.form);
</script>

<svelte:head>
  <title>{data.song.title} | D-sektionen</title>
  <meta name="description" content={data.song.lyrics} />
</svelte:head>

<button
  class="btn btn-secondary w-fit"
  on:click={() => (isEditing = !isEditing)}
>
  {isEditing ? "Sluta redigera" : "Redigera"}
</button>

{#if isEditing && data.accessPolicies.includes(apiNames.SONG.UPDATE)}
  <form method="POST" action="?/update" class="form-control gap-2" use:enhance>
    <input type="hidden" name="id" value={data.song.id} />
    <input
      type="hidden"
      name="title"
      value={data.song.title}
      {...$constraints.title}
    />
    <Labeled label="Melodi" id="melody" error={$errors.melody}>
      <p class="text-sm text-gray-400">
        Sök efter en melodi eller skriv in en ny.
      </p>
      <FuzzySelector
        name="melody"
        bind:value={$form.melody}
        allItems={data.existingMelodies}
        {...$constraints.melody}
        error={$errors.melody}
        searchValue={data.song.melody ?? ""}
      />
    </Labeled>
    <Labeled label="Kategori" id="category" error={$errors.category}>
      <p class="text-sm text-gray-400">
        Sök efter en kategori eller skriv in en ny.
      </p>
      <FuzzySelector
        name="category"
        bind:value={$form.category}
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
        bind:value={$form.lyrics}
        {...$constraints.lyrics}
      />
    </Labeled>
    <button
      class="btn btn-success mt-4 w-fit"
      type="submit"
      on:click={() => {
        isEditing = false;
      }}
    >
      Spara
    </button>
  </form>
{/if}

<SongElement song={data.song} />

{#if isEditing && data.accessPolicies.includes(apiNames.SONG.DELETE)}
  <form
    method="POST"
    action="?/delete"
    class="form-control gap-2"
    on:submit={async (event) => {
      if (!confirm("Är säker på att du vill ta bort sången?")) {
        event.preventDefault();
        return;
      }
      if (
        !confirm(
          `D-sektionens sångarkiv är viktigt för att bevara vår historia. 
Är du verkligen helt säker på att du vill ta bort sången?`,
        )
      ) {
        event.preventDefault();
        return;
      }
      if (
        !confirm("Detta går inte att ångra! Förstår du innebörden av detta?")
      ) {
        event.preventDefault();
        return;
      }
    }}
  >
    <input type="hidden" name="id" value={data.song.id} />
    <button
      class="btn btn-error w-fit
    "
    >
      Ta bort
    </button>
  </form>
{/if}

<Disclaimer />
