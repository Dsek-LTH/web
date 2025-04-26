<script lang="ts" generics="T extends {id: string}">
  import { page } from "$app/state";
  import { twMerge } from "tailwind-merge";

  // eslint-disable-next-line no-undef -- It is defined by svelte
  type EntityType = T;

  export const handleSearch = (searchValue: string) => {
    if (timeout) clearTimeout(timeout);
    if (searchValue.length < 3) {
      reset();
      return;
    }
    isSearching = true;
    timeout = setTimeout(getEntities(searchValue), 300);
  };
  interface Props {
    class?: string;
    endpoint: string;
    isSearching?: boolean;
    onSelect?: ((member: EntityType) => void) | undefined;
    year?: number | undefined;
    children?: import("svelte").Snippet;
    entity?: import("svelte").Snippet<[any]>;
  }

  let {
    class: clazz = "",
    endpoint,
    isSearching = $bindable(false),
    onSelect = undefined,
    year = undefined,
    children,
    entity,
  }: Props = $props();

  let timeout: ReturnType<typeof setTimeout> | undefined = undefined;

  let searchResults: EntityType[] | null = $state(null);
  const getEntities = (searchValue: string) => async () => {
    if (!searchValue) {
      reset();
      return;
    }

    const url = new URL(page.url.origin + endpoint);
    url.searchParams.append("search", searchValue);
    if (year) {
      url.searchParams.append("year", year.toString());
    }
    const data = await fetch(url, {
      method: "GET",
    })
      .then((res) => {
        if (!res.ok) {
          handleError();
          return;
        }
        return res.json();
      })
      .catch(() => handleError());
    searchResults = data || [];
    isSearching = false;
  };

  const handleError = () => {
    console.error("Failed to fetch entities");
    reset();
  };

  const reset = () => {
    searchResults = null;
    isSearching = false;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- This is a hack to get the id of the entity. We can assume all entities have an ID
  const getOptionid = (option: EntityType) => (option as any).id;
</script>

<div class={twMerge("dropdown overflow-visible", clazz)}>
  {@render children?.()}
  <ul
    class="menu-compact menu dropdown-content join join-vertical z-10 flex max-h-80 min-w-[20rem] flex-col flex-nowrap overflow-visible overflow-y-auto rounded-md bg-base-100 p-0 shadow shadow-black"
  >
    {#if searchResults != null}
      {#each searchResults as option (getOptionid(option))}
        <li>
          <button
            type="button"
            class="join-item w-full border-b border-b-base-content/10"
            onclick={() => {
              onSelect?.(option);
              reset();
            }}
          >
            {@render entity?.({ option })}
          </button>
        </li>
      {/each}
      {#if searchResults.length === 0}
        <li class="w-full border-b border-b-base-content/10">
          <button type="button" disabled class="disabled">
            Inga resultat hittades
          </button>
        </li>
      {/if}
    {/if}
  </ul>
</div>
