<script lang="ts">
  import { enhance } from "$app/forms";
  import TagEditorRow from "./TagEditorRow.svelte";

  export let data;
  export let form;

  let createLoading = false;
</script>

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
        <TagEditorRow {tag} />
      {/each}
    </tbody>
  </table>
</div>

<section class="flex flex-col gap-4 py-4">
  <h2 class="text-xl font-bold">Add new tags</h2>
  <form
    class="form-control gap-4"
    method="POST"
    action="?/create"
    use:enhance={() => {
      createLoading = true;
      return async ({ update }) => {
        await update();
        createLoading = false;
      };
    }}
  >
    <label class="join">
      <span class="label join-item bg-base-200 px-4">New tag</span>
      <input
        type="text"
        name="name"
        placeholder="Tag name"
        class="input join-item input-bordered input-primary w-80"
        value={form?.data?.name ?? ""}
        required
      />
      <button type="submit" class="btn btn-primary join-item" disabled={createLoading}>
        Skapa</button
      >
    </label>
  </form>
  {#if form?.error}
    <p class="text-error">{form.error}</p>
  {/if}
</section>
