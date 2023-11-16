<script lang="ts">
  import { superForm } from "sveltekit-superforms/client";
  import TagEditorRow from "./TagEditorRow.svelte";

  export let data;
  const { form, errors, constraints, enhance, submitting } = superForm(data.createForm, {
    resetForm: true,
  });
</script>

<svelte:head>
  <title>Nyhetstaggar | D-sektionen</title>
</svelte:head>

<div class="overflow-x-auto">
  <table class="table">
    <!-- head -->
    <thead>
      <tr class="bg-base-200">
        <th>Preview</th>
        <th>Name</th>
        <th>Color</th>
        <th />
      </tr>
    </thead>
    <tbody>
      {#each data.tags as tag (tag.id)}
        <TagEditorRow {tag} data={data.updateForm} />
      {/each}
    </tbody>
  </table>
</div>

<section class="flex flex-col gap-4 py-4">
  <h2 class="text-xl font-bold">Add new tags</h2>
  <form class="form-control gap-4" method="POST" action="?/create" use:enhance>
    <label class="join">
      <span class="label join-item bg-base-200 px-4">New tag</span>
      <input
        type="text"
        name="name"
        placeholder="Tag name"
        class="input join-item input-bordered input-primary w-80"
        bind:value={$form.name}
        {...$constraints.name}
      />
      <button type="submit" class="btn btn-primary join-item" disabled={$submitting}> Skapa</button>
    </label>
    {#if $errors.name}
      <p class="text-error">{$errors.name}</p>
    {/if}
  </form>
</section>
