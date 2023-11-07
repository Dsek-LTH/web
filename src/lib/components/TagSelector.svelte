<script lang="ts">
  import type { Tag } from "@prisma/client";
  import TagChip from "../../lib/components/TagChip.svelte";

  export let allTags: Tag[] = [];
  let searchValue = "";
  export let selectedTags: Tag[] = [];
  $: filteredTags = allTags.filter(
    (tag) =>
      tag.name.toLowerCase().includes(searchValue.toLowerCase()) && !selectedTags.includes(tag)
  );
</script>

<div class="dropdown">
  <div class="flex flex-col gap-2">
    <div class="absolute bottom-[calc(100%+0.5rem)] flex min-w-full flex-row items-center gap-2">
      {#if selectedTags.length > 0}
        {#each selectedTags as tag}
          <button
            type="button"
            on:click={() => {
              selectedTags = selectedTags.filter((o) => o !== tag);
            }}
          >
            <TagChip {tag} />
          </button>
        {/each}
        <button
          type="button"
          class="btn btn-xs"
          on:click={() => {
            selectedTags = [];
          }}>Clear</button
        >
      {:else}
        <div class="pointer-events-none opacity-0">
          <TagChip tag={allTags[0]} />
        </div>
        <button tabindex="-1" type="button" class="btn btn-xs pointer-events-none opacity-0"
        ></button>
      {/if}
    </div>
    <input
      id="autocomplete"
      autocomplete="off"
      autocapitalize="off"
      type="text"
      class="input input-bordered w-full"
      placeholder="Taggar"
      tabIndex={0}
      bind:value={searchValue}
      {...$$restProps}
    />
  </div>
  <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
  <ul
    tabindex={0}
    class="menu-compact menu dropdown-content join join-vertical z-10 flex max-h-80 min-w-[20rem] flex-col flex-nowrap overflow-y-auto rounded-md bg-base-100 shadow"
  >
    {#each filteredTags as tag (tag.id)}
      <li>
        <button
          type="button"
          class="join-item w-full border-b border-b-base-content/10 {selectedTags.includes(tag)
            ? 'bg-primary hover:bg-primary-content hover:text-primary'
            : ''}"
          on:click={() => {
            if (selectedTags.includes(tag)) {
              selectedTags = selectedTags.filter((o) => o !== tag);
            } else {
              selectedTags = [...selectedTags, tag];
            }
          }}
        >
          <TagChip {tag} />
        </button>
      </li>
    {/each}
    {#if filteredTags.length === 0}
      <li class="w-full border-b border-b-base-content/10">
        <button type="button" disabled class="disabled">No tags</button>
      </li>
    {/if}
  </ul>
</div>
