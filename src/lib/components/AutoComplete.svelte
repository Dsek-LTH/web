<script lang="ts">
  import type { Tag } from "@prisma/client";

  export let options: Tag[] = [];
  let searchValue = "";
  export let multiple = false;
  export let filter: (option: Tag, searchValue: string) => boolean = () => true;
  export let selected: Tag[] = [];
  $: filteredOptions = options.filter(
    (option) => filter(option, searchValue) && selected.includes(option) === false
  );
</script>

<div class="dropdown w-full">
  <div class="flex flex-col gap-2">
    {#if multiple}
      <div class="flex flex-row items-center gap-2">
        {#if selected.length > 0}
          {#each selected as option}
            <button
              type="button"
              on:click={() => {
                selected = selected.filter((o) => o !== option);
              }}
            >
              <slot name="selected-option" {option} />
            </button>
          {/each}
          <button
            type="button"
            class="btn btn-xs"
            on:click={() => {
              selected = [];
            }}>Clear</button
          >
        {:else}
          <div class="pointer-events-none opacity-0">
            <slot name="selected-option" option={options[0]} />
          </div>
          <button type="button" class="btn btn-xs pointer-events-none opacity-0"></button>
        {/if}
      </div>
    {/if}
    <input
      type="text"
      class="input input-bordered w-full"
      placeholder="Type something..."
      tabIndex={0}
      bind:value={searchValue}
    />
  </div>
  <div
    class="dropdown-content max-h-96 min-w-[20rem] flex-col overflow-y-auto rounded-md bg-base-100 shadow"
  >
    <ul class="menu-compact menu">
      {#each filteredOptions as option (option)}
        <li>
          <button
            type="button"
            class="w-full border-b border-b-base-content/10 {selected.includes(option)
              ? 'bg-primary hover:bg-primary-content hover:text-primary'
              : ''}"
            on:click={() => {
              if (multiple) {
                if (selected.includes(option)) {
                  selected = selected.filter((o) => o !== option);
                } else {
                  selected = [...selected, option];
                }
              } else {
                if (selected.includes(option)) {
                  selected = [];
                } else {
                  selected = [option];
                }
              }
            }}
          >
            <slot name="option" {option} />
          </button>
        </li>
      {/each}
      {#if filteredOptions.length === 0}
        <li class="w-full border-b border-b-base-content/10">
          <button type="button" disabled class="disabled">No options</button>
        </li>
      {/if}
    </ul>
  </div>
</div>
