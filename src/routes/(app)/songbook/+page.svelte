<script lang="ts">
  import * as m from "$paraglide/messages.js";
  import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "$lib/components/ui/card/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Badge } from "$lib/components/ui/badge/index.js";
  import { resolve } from "$app/paths";
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import Pagination from "$lib/components/Pagination.svelte";
  import SearchIcon from "@lucide/svelte/icons/search";

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
      goto(resolve(url.pathname + "?" + url.searchParams.toString()), { keepFocus: true, replaceState: true });
    }, 300);
  }

  function toggleCategory(category: string, currentSelected: boolean) {
    const url = new URL(page.url);
    if (currentSelected) {
      // Removing category: we need to reconstruct the URLSearchParams
      // because delete() removes all instances of the key
      const newCategories = data.categoryFilter.filter(c => c !== category);
      url.searchParams.delete("category");
      newCategories.forEach(c => url.searchParams.append("category", c));
    } else {
      url.searchParams.append("category", category);
    }
    url.searchParams.set("page", "1");
    goto(resolve(url.pathname + "?" + url.searchParams.toString()), { keepFocus: true, replaceState: true });
  }
</script>

<div class="flex flex-col gap-0">
  <h1 class="mb-4 text-3xl font-bold">{m.songBook()}</h1>
  <p class="text-muted-foreground mb-4">{m.songbook_hereYouWillFind ? m.songbook_hereYouWillFind() : m.songbook_hereYoullFind ? (m as any).songbook_hereYoullFind() : ""}</p>

  <div class="flex flex-col gap-4 mb-8">
    <div class="flex-1 md:flex-row md:items-end">
      <!-- Shadcn input might not natively support slot for icon in this project, but we can wrap it if needed.
           The news page used <Input><Search/></Input>. We'll use a relative wrapper to mimic typical search boxes or just the input. -->
      <div class="relative max-w-md">
        <SearchIcon class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder={m.search_search ? m.search_search() : "Search"}
          value={data.search}
          oninput={handleSearch}
          class="pl-8"
        />
      </div>
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
    {#each data.songs as song (song.id)}
      <a
        href={resolve(`/songbook/${song.slug}`)}
        class="block h-full transition-transform hover:scale-[1.02]"
      >
        <Card class="h-full cursor-pointer hover:bg-muted/50">
          <CardHeader>
            <CardTitle>{song.title}</CardTitle>
            {#if song.category}
              <CardDescription>
                <Badge variant="outline" class="mt-2">{song.category}</Badge>
              </CardDescription>
            {/if}
          </CardHeader>
          <CardContent>
            <p class="text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap">{song.lyrics}</p>
          </CardContent>
        </Card>
      </a>
    {:else}
      <p class="text-muted-foreground">No songs found.</p>
    {/each}
  </div>

  <Pagination pageCount={data.pageCount} />

  <p class="text-muted-foreground mt-8 text-sm italic">
    {m.songbook_disclaimer()}
  </p>
</div>
