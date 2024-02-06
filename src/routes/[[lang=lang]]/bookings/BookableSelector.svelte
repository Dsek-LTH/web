<script lang="ts">
  import type { Bookable } from "@prisma/client";
  // import type { Bookable, Tag } from "@prisma/client";
  // import TagChip from "../../lib/components/TagChip.svelte";

  export let allBookables: Bookable[] = [];
  let searchValue = "";
  export let selectedBookables: Bookable[] = [];
  $: filteredBookables = allBookables.filter(
    (bookable) =>
      bookable.name.toLowerCase().includes(searchValue.toLowerCase()) &&
      !selectedBookables.includes(bookable),
  );
</script>

<div class="dropdown">
  <div class="flex flex-col gap-2">
    <div
      class="absolute bottom-[calc(100%+0.5rem)] flex min-w-full flex-row items-center gap-2"
    >
      {#if selectedBookables.length > 0}
        {#each selectedBookables as bookable}
          <button
            type="button"
            on:click={() => {
              selectedBookables = selectedBookables.filter(
                (o) => o !== bookable,
              );
            }}
          >
            <span
              class="badge badge-md relative cursor-pointer whitespace-nowrap text-xs"
            >
              <div class="absolute inset-0 opacity-10 transition-colors" />
              {bookable.name}
            </span>
          </button>
        {/each}
        <button
          type="button"
          class="btn btn-xs"
          on:click={() => {
            selectedBookables = [];
          }}>Clear</button
        >
      {:else}
        <div class="pointer-events-none opacity-0">allBookables[0].name</div>
        <button
          tabindex="-1"
          type="button"
          class="btn btn-xs pointer-events-none opacity-0"
        ></button>
      {/if}
    </div>
    <input
      id="autocomplete"
      autocomplete="off"
      autocapitalize="off"
      type="text"
      class="input input-bordered w-full"
      placeholder="Bookables"
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
    {#each filteredBookables as bookable (bookable.id)}
      <li>
        <button
          type="button"
          class="join-item w-full border-b border-b-base-content/10 {selectedBookables.includes(
            bookable,
          )
            ? 'bg-primary hover:bg-primary-content hover:text-primary'
            : ''}"
          on:click={() => {
            if (selectedBookables.includes(bookable)) {
              selectedBookables = selectedBookables.filter(
                (o) => o !== bookable,
              );
            } else {
              selectedBookables = [...selectedBookables, bookable];
            }
          }}
        >
          <span
            class="badge badge-md relative cursor-pointer whitespace-nowrap text-xs"
          >
            <div class="absolute inset-0 opacity-10 transition-colors" />
            {bookable.name}
          </span>
        </button>
      </li>
    {/each}
    {#if filteredBookables.length === 0}
      <li class="w-full border-b border-b-base-content/10">
        <button type="button" disabled class="disabled">No Bookables</button>
      </li>
    {/if}
  </ul>
</div>
