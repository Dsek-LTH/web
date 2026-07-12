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
  import { Button } from "$lib/components/ui/button/index.js";
  import { Switch } from "$lib/components/ui/switch/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import { SvelteURLSearchParams } from "svelte/reactivity";
  import Pagination from "$lib/components/Pagination.svelte";
  import SearchIcon from "@lucide/svelte/icons/search";
  import MusicIcon from "@lucide/svelte/icons/music";
  import Plus from "@lucide/svelte/icons/plus";
  import { resolve } from "$app/paths";
  import apiNames from "$lib/utils/apiNames";

  let { data } = $props();

  let timeout: ReturnType<typeof setTimeout> | null = null;

  const canCreate = $derived(
    data.user?.policies?.includes(apiNames.SONG.CREATE),
  );
  const canDelete = $derived(
    data.user?.policies?.includes(apiNames.SONG.DELETE),
  );

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

  function handleShowDeletedChange(checked: boolean) {
    const searchParams = new SvelteURLSearchParams(page.url.searchParams);
    if (checked) {
      searchParams.set("show-deleted", "true");
    } else {
      searchParams.delete("show-deleted");
    }
    searchParams.set("page", "1");

    // eslint-disable-next-line svelte/no-navigation-without-resolve -- Navigation uses relative search params
    goto(`?${searchParams.toString()}`, {
      keepFocus: true,
      noScroll: true,
      replaceState: true,
    });
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
      <div class="mb-4 flex flex-wrap items-center gap-4">
        <h1 class="mb-0">{m.songBook()}</h1>
        {#if canCreate}
          <Button
            href="/songbook/create"
            size="sm"
            class="flex items-center gap-2"
          >
            <Plus class="h-4 w-4" />
            {m.songbook_createNewSong()}
          </Button>
        {/if}
      </div>
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
    <div class="flex flex-col gap-4 md:flex-row md:items-center">
      <div class="flex-1">
        <Input
          type="text"
          placeholder={m.songbook_searchPlaceholder()}
          value={data.search}
          oninput={handleSearch}
        >
          <SearchIcon />
        </Input>
      </div>

      {#if canDelete}
        <div
          class="border-border bg-card flex items-center gap-3 rounded-lg border px-4 py-2"
        >
          <Switch
            id="show-deleted"
            checked={data.showDeleted}
            onCheckedChange={handleShowDeletedChange}
          />
          <Label
            for="show-deleted"
            class="cursor-pointer text-sm font-medium whitespace-nowrap"
          >
            {m.songbook_showDeleted()}
          </Label>
        </div>
      {/if}
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
          class="hover:bg-muted/50 animate-in fade-in fill-mode-backwards slide-in-from-bottom-[2rem] h-full cursor-pointer duration-300 {song.deletedAt
            ? 'border-destructive bg-destructive/5 hover:bg-destructive/10'
            : ''}"
          style="animation-delay:{index * 50}ms"
        >
          <CardHeader>
            <div class="flex items-start justify-between gap-4">
              <CardTitle class="flex flex-col gap-1">
                <span>{song.title}</span>
                {#if song.deletedAt}
                  <span
                    class="text-destructive text-xs font-semibold tracking-wider uppercase"
                  >
                    {m.songbook_deleted()}
                  </span>
                {/if}
              </CardTitle>
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
      <p class="text-muted-foreground">{m.songbook_noSongsFound()}</p>
    {/each}
  </div>

  <Pagination
    pageCount={data.pageCount}
    class={showBottomPagination ? "visible" : "hidden"}
  />
</div>
