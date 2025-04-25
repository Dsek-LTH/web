<script lang="ts">
  interface Props {
    value?: string | null | undefined;
    options?: string[];
    [key: string]: any;
  }

  let { value = $bindable(""), options = [], ...rest }: Props = $props();
  let filteredItems = $derived(
    options.filter(
      (item) =>
        item.toLowerCase().includes(value?.toLowerCase() ?? "") &&
        value !== item,
    ),
  );
</script>

<div class="dropdown">
  <input
    id="autocomplete"
    autocomplete="off"
    autocapitalize="off"
    type="text"
    class="input input-bordered w-full bg-transparent hover:border-base-content"
    bind:value
    {...rest}
  />

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
            onclick={() => (value = item)}
          >
            {item}
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</div>
