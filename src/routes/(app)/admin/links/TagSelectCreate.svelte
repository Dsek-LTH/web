<script lang="ts">
  import type { Tag } from "@prisma/client";
  import TagChip from "$lib/components/TagChip.svelte";

  const actualOnChange: () => void = () => {
    onChange();
    searchValue = "";
    autocompleteEl?.focus();
  };

  interface Props {
    /** Called when the list of selected tags changes */
    onChange?: () => void;
    /** All available tags */
    allTags?: Tag[];
    /** All selected tags */
    selectedTags?: Tag[];
    placeholder?: string;
    [key: string]: any;
  }

  let {
    onChange = () => {
      searchValue = "";
    },
    allTags = [],
    selectedTags = $bindable([]),
    placeholder = "Taggar",
    ...rest
  }: Props = $props();

  let searchValue = $state("");
  let filteredTags = $derived(
    allTags.filter(
      (tag) =>
        tag.name?.toLowerCase().includes(searchValue.toLowerCase()) &&
        !selectedTags.map((tag) => tag.id).includes(tag.id),
    ),
  );

  let autocompleteEl: HTMLInputElement = $state();

  let ableCreateNewTag = $derived(
    searchValue &&
      [...selectedTags, ...filteredTags].every(
        ({ name }) => name !== searchValue,
      ),
  );
</script>

<div class="dropdown">
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div
    class="input input-bordered flex h-auto min-h-12 items-center gap-2 py-2"
    tabindex={0}
    role="combobox"
    aria-controls="tags-panel"
    aria-expanded="false"
    onclick={() => autocompleteEl?.focus()}
  >
    <div class="flex flex-1 flex-wrap gap-1">
      {#if selectedTags.length > 0}
        {#each selectedTags as tag}
          <button
            type="button"
            onclick={() => {
              selectedTags = selectedTags.filter((o) => o !== tag);
              actualOnChange();
            }}
          >
            <TagChip {tag} class="after:ml-2 after:content-['x']" />
          </button>
        {/each}
      {/if}

      <input
        id="autocomplete"
        autocomplete="off"
        autocapitalize="off"
        type="text"
        {placeholder}
        class="bg-transparent"
        bind:value={searchValue}
        bind:this={autocompleteEl}
        {...rest}
      />
    </div>

    {#if selectedTags.length > 0}
      <button
        type="button"
        class="btn btn-xs"
        onclick={() => {
          selectedTags = [];
          actualOnChange();
        }}>Clear</button
      >
    {/if}
  </div>

  <ul
    tabindex={0}
    role="listbox"
    class="menu-compact menu dropdown-content join join-vertical z-10 flex max-h-80 w-full flex-col flex-nowrap overflow-y-auto rounded-md bg-base-100 shadow lg:max-w-[20rem]"
    id="tags-panel"
  >
    {#if ableCreateNewTag}
      {@const tag = {
        id: searchValue,
        name: searchValue,
        color: null,
        isDefault: null,
        nameEn: null,
      }}
      <li>
        <button
          type="button"
          class="join-item w-full border-b border-b-base-content/10"
          onclick={() => {
            if (selectedTags.includes(tag)) {
              selectedTags = selectedTags.filter((o) => o !== tag);
            } else {
              selectedTags = [...selectedTags, tag];
            }
            actualOnChange();
          }}
        >
          <i>Create Tag</i> "{searchValue}"
        </button>
      </li>
    {/if}
    {#each filteredTags as tag (tag.id)}
      <li>
        <button
          type="button"
          class="join-item w-full border-b border-b-base-content/10 {selectedTags.includes(
            tag,
          )
            ? 'bg-primary hover:bg-primary-content hover:text-primary'
            : ''}"
          onclick={() => {
            if (selectedTags.includes(tag)) {
              selectedTags = selectedTags.filter((o) => o !== tag);
            } else {
              selectedTags = [...selectedTags, tag];
            }
            actualOnChange();
          }}
        >
          <TagChip {tag} />
        </button>
      </li>
    {/each}
    {#if !ableCreateNewTag && filteredTags.length === 0}
      <li class="w-full border-b border-b-base-content/10">
        <button type="button" disabled class="disabled">No tags</button>
      </li>
    {/if}
  </ul>
</div>
