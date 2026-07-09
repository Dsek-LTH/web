<script lang="ts">
  import * as m from "$paraglide/messages.js";
  import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
  } from "$lib/components/ui/card/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Badge } from "$lib/components/ui/badge/index.js";
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import { SvelteURLSearchParams } from "svelte/reactivity";
  import Pagination from "$lib/components/Pagination.svelte";
  import SearchIcon from "@lucide/svelte/icons/search";
  import MusicIcon from "@lucide/svelte/icons/music";
  import { resolve } from "$app/paths";

  let { data } = $props();

  let timeout: ReturnType<typeof setTimeout> | null = null;

  function handleSearch(e: Event) {
    if (timeout) clearTimeout(timeout);
    const value = (e.target as HTMLInputElement).value;
    timeout = setTimeout(() => {
      const searchParams = new SvelteURLSearchParams(page.url.searchParams);
      if (value) {
        searchParams.set("search", value);
      } else {
        searchParams.delete("search");
      }
      searchParams.set("page", "1");

      // eslint-disable-next-line svelte/no-navigation-without-resolve -- Navigation uses relative search params
      goto(`?${searchParams.toString()}`, {
        keepFocus: true,
        noScroll: true,
        replaceState: true,
      });
    }, 300);
  }

  function toggleCategory(category: string, currentSelected: boolean) {
    const searchParams = new SvelteURLSearchParams(page.url.searchParams);
    if (currentSelected) {
      // Removing category: we need to reconstruct the URLSearchParams
      // because delete() removes all instances of the key
      const newCategories = data.categoryFilter.filter((c) => c !== category);
      searchParams.delete("category");
      newCategories.forEach((c) => searchParams.append("category", c));
    } else {
      searchParams.append("category", category);
    }
    searchParams.set("page", "1");

    // eslint-disable-next-line svelte/no-navigation-without-resolve -- Navigation uses relative search params
    goto(`?${searchParams.toString()}`, {
      keepFocus: true,
      noScroll: true,
      replaceState: true,
    });
  }

  // Having two rows of pagination buttons looks weird with few results.
  const showBottomPagination = $derived(data.songs.length > 2);
</script>

<div class="flex flex-col gap-0">
  <div class="mb-8 flex flex-row items-center justify-between">
    <div class="md:w-7/12">
      <h1>{m.songBook()}</h1>
      <p>{m.songbook_hereYoullFind()}</p>
      <p class="text-muted-foreground italic">{m.songbook_disclaimer()}</p>
    </div>
    <div class="hidden w-4/12 rounded-lg md:block">
      <div
        class="bg-primary/5 flex aspect-[4/3] items-center justify-center rounded-lg border-[1px] shadow-xl"
      >
        <MusicIcon
          class="text-primary h-32 w-32 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]"
        />
      </div>
    </div>
  </div>

  <div class="mb-8 flex flex-col gap-4">
    <div class="flex-1 md:flex-row md:items-end">
      <Input
        type="text"
        placeholder={m.search_search ? m.search_search() : "Search"}
        value={data.search}
        oninput={handleSearch}
      >
        <SearchIcon />
      </Input>
    </div>

    <div class="flex flex-wrap gap-2">
      {#each data.categories as category (category)}
        {@const isSelected = data.categoryFilter.includes(category)}
        <button
          type="button"
          class="cursor-pointer"
          onclick={() => toggleCategory(category, isSelected)}
        >
          <Badge variant={isSelected ? "lila" : "outline"}>
            {category}
          </Badge>
        </button>
      {/each}
    </div>
  </div>

  <Pagination pageCount={data.pageCount} class="pb-2" />

  <div class="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
    {#each data.songs as song, index (song.id)}
      <a
        href={resolve(`/songbook/${song.slug}`)}
        class="block h-full transition-transform"
      >
        <Card
          class="hover:bg-muted/50 animate-in fade-in fill-mode-backwards slide-in-from-bottom-[2rem] h-full cursor-pointer duration-300"
          style="animation-delay:{index * 50}ms"
        >
          <CardHeader>
            <div class="flex items-start justify-between gap-4">
              <CardTitle>{song.title}</CardTitle>
              {#if song.category}
                <Badge variant="outline" class="shrink-0">{song.category}</Badge
                >
              {/if}
            </div>
          </CardHeader>
          <CardContent>
            <p
              class="text-muted-foreground line-clamp-3 text-sm whitespace-pre-wrap"
            >
              {song.lyrics}
            </p>
          </CardContent>
        </Card>
      </a>
    {:else}
      <p class="text-muted-foreground">No songs found.</p>
    {/each}
  </div>

  <Pagination
    pageCount={data.pageCount}
    class={showBottomPagination ? "visible" : "hidden"}
  />
</div>
