<script lang="ts">
  import Input from "$lib/components/Input.svelte";
  import Labeled from "$lib/components/Labeled.svelte";
  import { superForm } from "sveltekit-superforms/client";
  import AutoCompleteSelector from "$lib/components/AutoCompleteSelector.svelte";

  export let data;

  const { form, errors, constraints, enhance } = superForm(data.form);
</script>

<svelte:head>
  <title>Skapa sång | D-sektionen</title>
</svelte:head>

<main>
  <section class="grid grid-cols-2 gap-4">
    <form
      method="POST"
      action="?/create"
      class="form-control gap-2"
      use:enhance
    >
      <Input
        name="title"
        label="Titel"
        bind:value={$form.title}
        {...$constraints.title}
        error={$errors.title}
      />
      <Labeled label="Melodi" id="melody" error={$errors.melody}>
        <p class="text-sm text-gray-400">
          Sök efter en melodi eller skriv in en ny.
        </p>
        <AutoCompleteSelector
          name="melody"
          bind:value={$form.melody}
          allItems={data.existingMelodies}
          {...$constraints.melody}
          error={$errors.melody}
        /></Labeled
      >
      <Labeled label="Kategori" id="category" error={$errors.category}
        ><p class="text-sm text-gray-400">
          Sök efter en kategori eller skriv in en ny.
        </p>
        <AutoCompleteSelector
          name="category"
          bind:value={$form.category}
          allItems={data.existingCategories}
          {...$constraints.category}
          error={$errors.category}
        /></Labeled
      >
      <Labeled label="Text" id="lyrics" error={$errors.lyrics}>
        <textarea
          id="lyrics"
          name="lyrics"
          class="textarea textarea-bordered h-96"
          bind:value={$form.lyrics}
          {...$constraints.lyrics}
        ></textarea>
      </Labeled>
      <button class="btn btn-primary mt-4" type="submit"> Skapa sång </button>
    </form>
  </section>
</main>
