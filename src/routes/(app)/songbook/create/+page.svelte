<script lang="ts">
  import Input from "$lib/components/Input.svelte";
  import Labeled from "$lib/components/Labeled.svelte";
  import { superForm } from "sveltekit-superforms/client";
  import Autocomplete from "$lib/components/Autocomplete.svelte";
  import PageHeader from "$lib/components/PageHeader.svelte";

  import type { PageData } from "./$types";
  export let data: PageData;

  const { form, errors, constraints, enhance } = superForm(data.form);
</script>

<PageHeader title="Skapa ny sång" />

<main>
  <section>
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
      <Labeled
        label="Melodi"
        error={$errors.melody}
        explanation="Sök efter en melodi eller skriv in en ny"
      >
        <Autocomplete
          name="melody"
          bind:value={$form.melody}
          options={data.existingMelodies}
          {...$constraints.melody}
          error={$errors.melody}
        />
      </Labeled>
      <Labeled
        label="Kategori"
        error={$errors.category}
        explanation="Sök efter en kategori eller skriv in en ny"
      >
        <Autocomplete
          name="category"
          bind:value={$form.category}
          options={data.existingCategories}
          {...$constraints.category}
          error={$errors.category}
        />
      </Labeled>
      <Labeled label="Text" error={$errors.lyrics}>
        <textarea
          id="lyrics"
          name="lyrics"
          class="textarea textarea-bordered h-80 hover:border-base-content"
          bind:value={$form.lyrics}
          {...$constraints.lyrics}
        />
      </Labeled>
      <button class="btn btn-primary mt-4" type="submit">Skapa</button>
    </form>
  </section>
</main>
