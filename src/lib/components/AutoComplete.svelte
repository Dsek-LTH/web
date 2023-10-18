<script lang="ts">
  import type { Tag } from "@prisma/client";

  export let options: Tag[] = [];
  let searchValue = "";
  export let filter: (option: Tag, searchValue: string) => boolean = () => true;
  export let selected: Tag[] = [];
  $: filteredOptions = options.filter(
    (option) => filter(option, searchValue.toLowerCase()) && selected.includes(option) === false
  );
</script>

<div class="dropdown">
  <div class="flex flex-col gap-2">
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
    <input
      type="text"
      class="input input-bordered w-full"
      placeholder="Taggar"
      tabIndex={0}
      bind:value={searchValue}
    />
  </div>
  <ul
    class="menu-compact menu dropdown-content join join-vertical z-10 flex max-h-80 min-w-[20rem] flex-col flex-nowrap overflow-y-auto rounded-md bg-base-100 shadow"
  >
    {#each filteredOptions as option (option)}
      <li>
        <button
          type="button"
          class="join-item w-full border-b border-b-base-content/10 {selected.includes(option)
            ? 'bg-primary hover:bg-primary-content hover:text-primary'
            : ''}"
          on:click={() => {
            if (selected.includes(option)) {
              selected = selected.filter((o) => o !== option);
            } else {
              selected = [...selected, option];
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
