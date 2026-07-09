<script lang="ts">
  import * as m from "$paraglide/messages.js";
  import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
  } from "$lib/components/ui/card/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Badge } from "$lib/components/ui/badge/index.js";
  import { resolve } from "$app/paths";
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import Pagination from "$lib/components/Pagination.svelte";
  import SearchIcon from "@lucide/svelte/icons/search";
  import MusicIcon from "@lucide/svelte/icons/music";

  let { data } = $props();

  let timeout: ReturnType<typeof setTimeout> | null = null;

  function handleSearch(e: Event) {
    if (timeout) clearTimeout(timeout);
    const value = (e.target as HTMLInputElement).value;
    timeout = setTimeout(() => {
      const url = new URL(page.url);
      if (value) {
        url.searchParams.set("search", value);
      } else {
        url.searchParams.delete("search");
      }
      url.searchParams.set("page", "1");
      goto(resolve(url.pathname + "?" + url.searchParams.toString()), {
        keepFocus: true,
        replaceState: true,
      });
    }, 300);
  }

  function toggleCategory(category: string, currentSelected: boolean) {
    const url = new URL(page.url);
    if (currentSelected) {
      // Removing category: we need to reconstruct the URLSearchParams
      // because delete() removes all instances of the key
      const newCategories = data.categoryFilter.filter((c) => c !== category);
      url.searchParams.delete("category");
      newCategories.forEach((c) => url.searchParams.append("category", c));
    } else {
      url.searchParams.append("category", category);
    }
    url.searchParams.set("page", "1");
    goto(resolve(url.pathname + "?" + url.searchParams.toString()), {
      keepFocus: true,
      replaceState: true,
    });
  }

  const showTopPagination = $derived(data.songs.length > 2);
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

  <Pagination
    pageCount={data.pageCount}
    class={["pb-2", showTopPagination ? "visible" : "hidden"]}
  />

  <div class="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
    {#each data.songs as song (song.id)}
      <a
        href={resolve(`/songbook/${song.slug}`)}
        class="block h-full transition-transform hover:scale-[1.02]"
      >
        <Card class="hover:bg-muted/50 h-full cursor-pointer">
          <CardHeader>
            <CardTitle>{song.title}</CardTitle>
            {#if song.category}
              <CardDescription>
                <Badge variant="outline" class="mt-2">{song.category}</Badge>
              </CardDescription>
            {/if}
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

  <Pagination pageCount={data.pageCount} />
</div>
