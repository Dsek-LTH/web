<script lang="ts">
  import * as m from "$paraglide/messages";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import AlbumCard from "./AlbumCard.svelte";
  import type { PageProps } from "./$types";
  import type { AlbumSchema } from "./schema";
  import { isAuthorized } from "$lib/utils/authorization";
  import apiNames from "$lib/utils/apiNames";
  import { PUBLIC_BUCKETS_ALBUMS } from "$env/static/public";
  import * as Collapsible from "$lib/components/ui/collapsible";
  import { Button } from "$lib/components/ui/button";
  import { Separator } from "$lib/components/ui/separator";
  import Plus from "@lucide/svelte/icons/plus";
  import ChevronDown from "@lucide/svelte/icons/chevron-down";

  let { data }: PageProps = $props();
  let albums: AlbumSchema[] = $derived(data.albums as AlbumSchema[]);
  let canCreate = $derived(
    isAuthorized(
      apiNames.FILES.BUCKET(PUBLIC_BUCKETS_ALBUMS).CREATE,
      data.user,
    ),
  );

  type YearGroup = { year: number; albums: AlbumSchema[] };

  let yearGroups: YearGroup[] = $derived.by(() => {
    const groups: Record<number, AlbumSchema[]> = {};
    for (const album of albums) {
      const year = Number(album.date.slice(0, 4));
      (groups[year] ??= []).push(album);
    }
    return Object.entries(groups)
      .map(([year, yearAlbums]) => ({
        year: Number(year),
        albums: yearAlbums.sort((a, b) => b.date.localeCompare(a.date)),
      }))
      .sort((a, b) => b.year - a.year);
  });

  // All years start expanded; users can collapse the ones they don't need.
  let openYears = $state<Record<number, boolean>>({});

  function isYearOpen(year: number) {
    return openYears[year] ?? true;
  }

  function goToYear(year: number) {
    openYears[year] = true;
    document.getElementById(`year-${year}`)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    history.replaceState(null, "", `#year-${year}`);
  }
</script>

<SetPageTitle title={m.gallery()} />

<div class="layout-container">
  <div class="flex flex-wrap items-center justify-between gap-3">
    <h1 class="text-3xl font-bold">{m.gallery()}</h1>
    {#if canCreate}
      <Button href="/gallery/upload" size="sm">
        <Plus class="size-4" />
        {m.gallery_create_album()}
      </Button>
    {/if}
  </div>

  {#if yearGroups.length === 0}
    <p class="text-muted-foreground mt-8">{m.gallery_no_albums()}</p>
  {:else}
    <div class="mt-8 flex flex-col gap-8 lg:flex-row lg:gap-12">
      <aside class="lg:sticky lg:top-24 lg:h-fit lg:w-44 lg:shrink-0">
        <nav aria-label={m.gallery_years()}>
          <h2
            class="text-muted-foreground px-2 text-sm font-semibold tracking-wide uppercase"
          >
            {m.gallery_years()}
          </h2>
          <Separator class="my-2" />
          <div class="flex flex-row flex-wrap gap-1 lg:flex-col">
            {#each yearGroups as group (group.year)}
              <Button
                variant="ghost"
                size="sm"
                class="justify-start lg:w-full"
                href={`#year-${group.year}`}
                onclick={(event) => {
                  event.preventDefault();
                  goToYear(group.year);
                }}
              >
                {group.year}
                <span class="text-muted-foreground ml-auto text-xs">
                  {group.albums.length}
                </span>
              </Button>
            {/each}
          </div>
        </nav>
      </aside>

      <div class="min-w-0 flex-1 space-y-6">
        {#each yearGroups as group (group.year)}
          <section id={`year-${group.year}`} class="scroll-mt-24">
            <Collapsible.Root
              open={isYearOpen(group.year)}
              onOpenChange={(open) => (openYears[group.year] = open)}
            >
              <Collapsible.Trigger
                class="group hover:bg-secondary-hover flex w-full cursor-pointer items-center gap-3 rounded-lg px-2 py-3 text-left transition-colors [&[data-state=open]>svg]:rotate-180"
              >
                <ChevronDown class="size-5 shrink-0 transition-transform" />
                <span class="text-2xl font-semibold">{group.year}</span>
                <span class="text-muted-foreground text-sm">
                  {group.albums.length}
                  {group.albums.length === 1
                    ? m.gallery_album()
                    : m.gallery_albums()}
                </span>
              </Collapsible.Trigger>
              <Collapsible.Content>
                <div
                  class="mt-4 grid grid-cols-1 items-stretch gap-4 md:grid-cols-2 lg:grid-cols-3"
                >
                  {#each group.albums as album (album.id)}
                    <AlbumCard {album} />
                  {/each}
                </div>
              </Collapsible.Content>
            </Collapsible.Root>
          </section>
        {/each}
      </div>
    </div>
  {/if}
</div>
