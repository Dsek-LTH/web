<script lang="ts">
  import type { Position } from "@prisma/client";

  /** Called when the list of selected options changes */
  export let onChange: () => void = () => {
    searchValue = "";
  };
  export let name: string | undefined = undefined;

  const internalOnChange: () => void = () => {
    onChange();
    searchValue = "";
    autocompleteEl?.focus();
  };

  /** All available options */
  export let options: Position[] = [];

  /** All selected options */
  export let selected: Array<
    Pick<Position, "id" | "name" | "nameEn"> &
      Partial<Omit<Position, "id" | "name" | "nameEn">>
  > = [];

  let searchValue = "";
  $: filtered = options.filter(
    (option) =>
      option.name.toLowerCase().includes(searchValue.toLowerCase()) &&
      !selected.map((option) => option.id).includes(option.id),
  );

  let autocompleteEl: HTMLInputElement;
</script>

<div class="dropdown w-full">
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <div
    class="input input-bordered flex h-auto min-h-12 items-center gap-2 py-2"
    tabindex={0}
    role="combobox"
    aria-controls="tags-panel"
    aria-expanded="false"
    on:click={() => autocompleteEl?.focus()}
  >
    <div class="flex flex-1 flex-wrap gap-1">
      {#if selected.length > 0}
        {#each selected as selection}
          {@const original = options.find((t) => t.id === selection.id)}
          <button
            type="button"
            class="btn"
            on:click={() => {
              selected = selected.filter((o) => o !== selection);
              internalOnChange();
            }}
          >
            <div class="after:ml-2 after:content-['x']">{original?.name}</div>
          </button>
        {/each}
      {/if}

      <input
        {name}
        id={name ?? "autocomplete"}
        autocomplete="off"
        autocapitalize="off"
        type="text"
        placeholder="Positions"
        class="bg-transparent"
        bind:value={searchValue}
        bind:this={autocompleteEl}
        {...$$restProps}
      />
    </div>

    {#if selected.length > 0}
      <button
        type="button"
        class="btn btn-xs"
        on:click={() => {
          selected = [];
          internalOnChange();
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
    {#each filtered as option (option.id)}
      <li>
        <button
          type="button"
          class="join-item w-full border-b border-b-base-content/10 {selected.includes(
            option,
          )
            ? 'bg-primary hover:bg-primary-content hover:text-primary'
            : ''}"
          on:click={() => {
            if (selected.includes(option)) {
              selected = selected.filter((o) => o.id !== option.id);
            } else {
              selected = [...selected, option];
            }
            internalOnChange();
          }}
        >
          <div>{option.name}</div>
        </button>
      </li>
    {/each}
    {#if filtered.length === 0}
      <li class="w-full border-b border-b-base-content/10">
        <button type="button" disabled class="disabled">No options found</button
        >
      </li>
    {/if}
  </ul>
</div>
