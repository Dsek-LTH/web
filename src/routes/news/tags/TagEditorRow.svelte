<script lang="ts">
  import { enhance } from "$app/forms";
  import TagChip from "$lib/components/TagChip.svelte";
  import type { Tag } from "@prisma/client";

  export let tag: Tag;
  let internalTag = { ...tag };
  let isEditing = false;
  let isLoading = false;
</script>

<tr>
  <td><TagChip tag={internalTag} /></td>
  {#if !isEditing}
    <td>{tag.name}</td>
    <td class="text-right">
      <button class="btn btn-xs px-8" type="button" on:click={() => (isEditing = !isEditing)}
        >Edit
      </button>
    </td>
  {:else}
    <td colspan="2">
      <form
        action="?/update"
        method="POST"
        use:enhance={() => {
          isLoading = true;
          return async ({ update }) => {
            internalTag = { ...tag };
            await update();
            isLoading = false;
            isEditing = false;
          };
        }}
        class="flex justify-between"
      >
        <input type="hidden" name="id" value={tag.id} />
        <input
          type="text"
          name="name"
          bind:value={internalTag.name}
          class="input input-bordered input-xs"
        />
        <button type="submit" class="btn btn-xs px-8" disabled={isLoading}>
          {#if isLoading}
            <span class="loading loading-xs mx-1"></span>
          {:else}
            Save
          {/if}
        </button>
      </form>
    </td>
  {/if}
</tr>
