<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import TagSelector from "$lib/components/TagSelector.svelte";
  import { Input } from "$lib/components/ui/input";
  import type { ExtendedPrismaModel } from "$lib/server/extendedPrisma";
  import { debounce } from "$lib/utils/debounce";
  import * as m from "$paraglide/messages";

  import Search from "@lucide/svelte/icons/search";

  let { allTags }: { allTags: Array<ExtendedPrismaModel<"Tag">> } = $props();

  let search = $state(page.url.searchParams.get("search") ?? "");

  const selectedTags = $derived(
    allTags.filter((tag) =>
      page.url.searchParams.getAll("tags").includes(tag.name),
    ),
  );

  /** Changes the query while keeping everything else (e.g. `display`), and starts from the first page again. */
  const updateQuery = (update: (params: URLSearchParams) => void) => {
    const url = new URL(page.url);
    update(url.searchParams);
    url.searchParams.delete("page");
    // eslint-disable-next-line svelte/no-navigation-without-resolve -- we use `page.url`
    goto(url, { keepFocus: true, noScroll: true, replaceState: true });
  };

  const debouncedSearch = debounce(() => {
    updateQuery((params) => {
      if (search) params.set("search", search);
      else params.delete("search");
    });
  }, 300);

  const setTags = (tags: Array<Pick<ExtendedPrismaModel<"Tag">, "id">>) => {
    const names = allTags
      .filter((tag) => tags.some(({ id }) => id === tag.id))
      .map((tag) => tag.name);
    updateQuery((params) => {
      params.delete("tags");
      names.forEach((name) => params.append("tags", name));
    });
  };
</script>

<div class="flex flex-col gap-2 md:flex-row">
  <div class="md:flex-1">
    <Input
      type="search"
      name="search"
      autocomplete="off"
      placeholder={m.search_search()}
      aria-label={m.search_search()}
      bind:value={search}
      oninput={() => debouncedSearch()}
      onkeydown={(event) => {
        if (event.key === "Enter") debouncedSearch.flush();
      }}><Search /></Input
    >
  </div>
  <div class="md:flex-1">
    <TagSelector
      {allTags}
      aria-label={m.events_tags()}
      bind:selectedTags={() => selectedTags, setTags}
    />
  </div>
</div>
