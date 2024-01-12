<script lang="ts">
  export let allItems: string[] = [];
  export let searchValue = "";
  $: filteredItems = allItems.filter(
    (item) =>
      item.toLowerCase().includes(searchValue.toLowerCase()) &&
      searchValue !== item,
  );

  let autocompleteEl: HTMLInputElement;
</script>

<div class="dropdown">
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <div
    class="input input-bordered flex h-auto min-h-12 items-center gap-2 py-2"
    tabindex={0}
    role="combobox"
    aria-controls="items-panel"
    aria-expanded="false"
    on:click={() => autocompleteEl?.focus()}
  >
    <div class="flex flex-1 flex-wrap gap-1">
      <input
        id="autocomplete"
        autocomplete="off"
        autocapitalize="off"
        type="text"
        class="w-full bg-transparent"
        bind:value={searchValue}
        bind:this={autocompleteEl}
        {...$$restProps}
      />
    </div>
  </div>

  {#if filteredItems.length !== 0}
    <ul
      tabindex={0}
      role="listbox"
      class="menu-compact menu dropdown-content join join-vertical z-10 flex max-h-80 w-full flex-col flex-nowrap overflow-y-auto border-primary bg-base-100 shadow"
      id="items-panel"
    >
      {#each filteredItems as item, i (i)}
        <li>
          <button
            type="button"
            class="join-item w-full border-b border-b-base-content/10"
            on:click={() => {
              if (searchValue === item) {
                searchValue = "";
              } else {
                searchValue = item;
              }
            }}
          >
            {item}
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</div>
