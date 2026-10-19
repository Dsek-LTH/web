<script lang="ts">
  import * as m from "$paraglide/messages.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Checkbox } from "$lib/components/ui/checkbox/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import * as Command from "$lib/components/ui/command/index.js";
  import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
  } from "$lib/components/ui/card/index.js";
  import { Spinner } from "$lib/components/ui/spinner";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import { enhance } from "$app/forms";
  import { page } from "$app/state";
  import { isSearchResultData } from "$lib/utils/search";
  import { debounce } from "$lib/utils/debounce";
  import { availableSearchIndexes } from "$lib/search/searchTypes";
  import type { SearchDataWithType } from "$lib/search/searchTypes";
  import Search from "@lucide/svelte/icons/search";
  import MemberSearchResult from "$lib/components/search/MemberSearchResult.svelte";
  import CommitteeSearchResult from "$lib/components/search/CommitteeSearchResult.svelte";
  import PositionSearchResult from "$lib/components/search/PositionSearchResult.svelte";
  import EventSearchResult from "$lib/components/search/EventSearchResult.svelte";
  import ArticleSearchResult from "$lib/components/search/ArticleSearchResult.svelte";
  import SongSearchResult from "$lib/components/search/SongSearchResult.svelte";
  import DocumentSearchResult from "$lib/components/search/DocumentSearchResult.svelte";

  const indexLabels: Record<(typeof availableSearchIndexes)[number], string> = {
    members: m.search_members(),
    events: m.search_events(),
    articles: m.search_articles(),
    positions: m.search_positions(),
    songs: m.search_songs(),
    committees: m.search_committees(),
    governingDocuments: m.search_governing_documents(),
    meetingDocuments: m.search_meeting_documents(),
  };

  let input = $state(page.url.searchParams.get("q") ?? "");
  let selected = $state(
    Object.fromEntries(
      availableSearchIndexes.map((index) => [index, true]),
    ) as Record<(typeof availableSearchIndexes)[number], boolean>,
  );
  let isSearching = $state(false);
  let hasSearched = $state(false);
  let results: SearchDataWithType[] = $state([]);

  let formElement: HTMLFormElement | null = $state(null);

  let grouped = $derived(
    Object.fromEntries(
      availableSearchIndexes.map((index) => [
        index,
        results.filter((r) => r.type === index),
      ]),
    ) as Record<(typeof availableSearchIndexes)[number], SearchDataWithType[]>,
  );

  const debouncedSubmit = debounce(() => formElement?.requestSubmit(), 300);

  $effect(() => {
    // Track filter changes too, so toggling a checkbox re-runs the search
    // for whatever query is already entered.
    void Object.values(selected);
    if (input.trim().length > 0) {
      debouncedSubmit();
    }
  });
</script>

<SetPageTitle title={m.search_advancedSearch()} />

<div class="mx-auto w-full max-w-5xl px-4 py-8">
  <h1 class="mb-6 text-3xl font-bold">{m.search_advancedSearch()}</h1>

  <Card class="mb-6">
    <CardContent class="pt-6">
      <form
        method="POST"
        bind:this={formElement}
        use:enhance={() => {
          isSearching = true;
          return async ({ update, result: incomingResult }) => {
            hasSearched = true;
            if (
              incomingResult.type === "success" &&
              isSearchResultData(incomingResult.data)
            ) {
              results = incomingResult.data.results;
            } else {
              results = [];
            }
            await update({ reset: false });
            isSearching = false;
          };
        }}
        class="flex flex-col gap-4"
      >
        <div class="flex gap-2">
          <Input
            name="input"
            bind:value={input}
            placeholder={m.search_search()}
            autofocus
          />
          <Button type="submit" class="flex items-center gap-2">
            {#if isSearching}
              <Spinner class="h-4 w-4" />
            {:else}
              <Search class="h-4 w-4" />
            {/if}
            {m.search_search()}
          </Button>
        </div>

        <div class="flex flex-wrap gap-4">
          {#each availableSearchIndexes as index (index)}
            <div class="flex items-center gap-2">
              <Checkbox
                id="index-{index}"
                name={index}
                bind:checked={selected[index]}
              />
              <Label for="index-{index}">{indexLabels[index]}</Label>
            </div>
          {/each}
        </div>
      </form>
    </CardContent>
  </Card>

  {#if hasSearched && !isSearching}
    {#if results.length === 0}
      <p class="text-muted-foreground">{m.search_noResults()}</p>
    {:else}
      <Command.Root shouldFilter={false} class="contents">
        <Command.List class="contents max-h-none overflow-visible">
          <div class="flex flex-col gap-6">
            {#if grouped.committees.length > 0}
              <Card>
                <CardHeader
                  ><CardTitle>{m.search_committees()}</CardTitle></CardHeader
                >
                <CardContent class="flex flex-col gap-1">
                  {#each grouped.committees as result, i (`committee-${i}`)}
                    <CommitteeSearchResult data={result.data as never} />
                  {/each}
                </CardContent>
              </Card>
            {/if}
            {#if grouped.positions.length > 0}
              <Card>
                <CardHeader
                  ><CardTitle>{m.search_positions()}</CardTitle></CardHeader
                >
                <CardContent class="flex flex-col gap-1">
                  {#each grouped.positions as result, i (`position-${i}`)}
                    <PositionSearchResult data={result.data as never} />
                  {/each}
                </CardContent>
              </Card>
            {/if}
            {#if grouped.members.length > 0}
              <Card>
                <CardHeader
                  ><CardTitle>{m.search_members()}</CardTitle></CardHeader
                >
                <CardContent class="flex flex-col gap-1">
                  {#each grouped.members as result, i (`member-${i}`)}
                    <MemberSearchResult data={result.data as never} />
                  {/each}
                </CardContent>
              </Card>
            {/if}
            {#if grouped.events.length > 0}
              <Card>
                <CardHeader
                  ><CardTitle>{m.search_events()}</CardTitle></CardHeader
                >
                <CardContent class="flex flex-col gap-1">
                  {#each grouped.events as result, i (`event-${i}`)}
                    <EventSearchResult data={result.data as never} />
                  {/each}
                </CardContent>
              </Card>
            {/if}
            {#if grouped.articles.length > 0}
              <Card>
                <CardHeader
                  ><CardTitle>{m.search_articles()}</CardTitle></CardHeader
                >
                <CardContent class="flex flex-col gap-1">
                  {#each grouped.articles as result, i (`article-${i}`)}
                    <ArticleSearchResult data={result.data as never} />
                  {/each}
                </CardContent>
              </Card>
            {/if}
            {#if grouped.songs.length > 0}
              <Card>
                <CardHeader
                  ><CardTitle>{m.search_songs()}</CardTitle></CardHeader
                >
                <CardContent class="flex flex-col gap-1">
                  {#each grouped.songs as result, i (`song-${i}`)}
                    <SongSearchResult data={result.data as never} />
                  {/each}
                </CardContent>
              </Card>
            {/if}
            {#if grouped.governingDocuments.length > 0}
              <Card>
                <CardHeader
                  ><CardTitle>{m.search_governing_documents()}</CardTitle
                  ></CardHeader
                >
                <CardContent class="flex flex-col gap-1">
                  {#each grouped.governingDocuments as result, i (`govdoc-${i}`)}
                    <DocumentSearchResult data={result.data as never} />
                  {/each}
                </CardContent>
              </Card>
            {/if}
            {#if grouped.meetingDocuments.length > 0}
              <Card>
                <CardHeader
                  ><CardTitle>{m.search_meeting_documents()}</CardTitle
                  ></CardHeader
                >
                <CardContent class="flex flex-col gap-1">
                  {#each grouped.meetingDocuments as result, i (`meetdoc-${i}`)}
                    <DocumentSearchResult data={result.data as never} />
                  {/each}
                </CardContent>
              </Card>
            {/if}
          </div>
        </Command.List>
      </Command.Root>
    {/if}
  {/if}
</div>
