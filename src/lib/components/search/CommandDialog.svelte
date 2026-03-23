<script lang="ts">
  import * as Command from "$lib/components/ui/command/index.js";
  import * as m from "$paraglide/messages";
  import type {
    ArticleSearchReturnAttributes,
    CommitteeSearchReturnAttributes,
    EventSearchReturnAttributes,
    GoverningDocumentSearchReturnAttributes,
    MeetingDocumentSearchReturnAttributes,
    MemberSearchReturnAttributes,
    PositionSearchReturnAttributes,
    SearchDataWithType,
    SongSearchReturnAttributes,
  } from "$lib/search/searchTypes";
  import { availableSearchIndexes } from "$lib/search/searchTypes";
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import { enhance } from "$app/forms";
  import { isSearchResultData } from "$lib/utils/search";
  import Search from "@lucide/svelte/icons/search";
  import MemberSearchResult from "./MemberSearchResult.svelte";
  import CommitteeSearchResult from "./CommitteeSearchResult.svelte";
  import PositionSearchResult from "./PositionSearchResult.svelte";
  import EventSearchResult from "./EventSearchResult.svelte";
  import ArticleSearchResult from "./ArticleSearchResult.svelte";
  import SongSearchResult from "./SongSearchResult.svelte";
  import DocumentSearchResult from "./DocumentSearchResult.svelte";
  import { resolve } from "$app/paths";
  import { debounce } from "$lib/utils/debounce";
  import { page } from "$app/state";

  let { open = $bindable(false) } = $props();

  let formElement: HTMLFormElement | null = $state(null);
  let inputElement: HTMLInputElement | null = $state(null);

  let input = $state("");
  let isSearching = $state(false);
  let results: SearchDataWithType[] = $state([]);

  let groupedResults = $derived<{
    members: Array<{ type: "members"; data: MemberSearchReturnAttributes }>;
    events: Array<{ type: "events"; data: EventSearchReturnAttributes }>;
    articles: Array<{ type: "articles"; data: ArticleSearchReturnAttributes }>;
    positions: Array<{
      type: "positions";
      data: PositionSearchReturnAttributes;
    }>;
    committees: Array<{
      type: "committees";
      data: CommitteeSearchReturnAttributes;
    }>;
    governingDocuments: Array<{
      type: "governingDocuments";
      data: GoverningDocumentSearchReturnAttributes;
    }>;
    meetingDocuments: Array<{
      type: "meetingDocuments";
      data: MeetingDocumentSearchReturnAttributes;
    }>;
    songs: Array<{ type: "songs"; data: SongSearchReturnAttributes }>;
  }>({
    members: results.filter((r) => r.type === "members"),
    events: results.filter((r) => r.type === "events"),
    articles: results.filter((r) => r.type === "articles"),
    positions: results.filter((r) => r.type === "positions"),
    committees: results.filter((r) => r.type === "committees"),
    governingDocuments: results.filter((r) => r.type === "governingDocuments"),
    meetingDocuments: results.filter((r) => r.type === "meetingDocuments"),
    songs: results.filter((r) => r.type === "songs"),
  });

  const debouncedSearch = debounce(() => {
    formElement?.requestSubmit();
  }, 300);

  function handleSearch() {
    if (!input) {
      debouncedSearch.cancel();
      isSearching = false;
      results = [];
      return;
    }
    isSearching = true;
    debouncedSearch();
  }

  // Arrow keys and Enter are handled by the Command component itself, which
  // keeps focus in the input and highlights the selected result
  function handleKeydown(event: KeyboardEvent) {
    // Most probable case first: user just presses a key
    // We should then start searching
    if (
      (open &&
        document.activeElement !== inputElement &&
        event.key.length === 1) ||
      ((event.key === "Backspace" || event.key === "Delete") &&
        input.length > 0)
    ) {
      isSearching = true;
      inputElement?.focus();
      return;
    }

    // User presses ctrl+k or cmd+k
    if (!open && (event.ctrlKey || event.metaKey) && event.key === "k") {
      event.preventDefault();
      open = true;
      return;
    }

    // User presses escape, close the dialog and blur the input
    if (open && event.key === "Escape") {
      inputElement?.blur();
      open = false;
      return;
    }

    // If it already is open and the user presses ctrl+k or cmd+k, focus and prevent default
    if (open && (event.ctrlKey || event.metaKey) && event.key === "k") {
      event.preventDefault();
      inputElement?.focus();
      return;
    }
  }

  onMount(() => {
    document.addEventListener("keydown", handleKeydown);
    return () => {
      document.removeEventListener("keydown", handleKeydown);
    };
  });

  // Reset input when dialog closes
  $effect(() => {
    if (!open) {
      debouncedSearch.cancel();
      input = "";
      results = [];
    }
  });

  export { open };
</script>

<Command.Dialog
  inset={page.data?.appInfo?.insets?.top ?? 0}
  bind:open
  shouldFilter={false}
>
  <form
    id="search-form"
    method="POST"
    action="/search"
    bind:this={formElement}
    use:enhance={async () => {
      return async ({ update, result: incomingResults }) => {
        console.log(incomingResults);
        if (
          incomingResults.type === "success" &&
          isSearchResultData(incomingResults.data)
        ) {
          results = incomingResults.data.results;
        } else if (incomingResults.type === "failure") {
          results = [];
        } else {
          console.log("Unknown return from search", incomingResults);
        }
        await update({
          reset: false,
        });
        isSearching = false;
      };
    }}
  >
    <Command.Input
      name="input"
      placeholder={m.search_search()}
      bind:value={input}
      bind:ref={inputElement}
      oninput={handleSearch}
      autofocus
      autocomplete="off"
    />
    {#each availableSearchIndexes as index (index)}
      <input type="hidden" name={index} value="on" />
    {/each}
  </form>
  <Command.List>
    <Command.Empty>
      {isSearching ? "Searching..." : m.search_noResults()}
    </Command.Empty>

    {#if groupedResults.committees.length > 0}
      <Command.Group heading={m.search_committees()}>
        {#each groupedResults.committees.slice(0, 3) as result, i (`committee-${i}`)}
          <CommitteeSearchResult data={result.data} />
        {/each}
      </Command.Group>
    {/if}

    {#if groupedResults.positions.length > 0}
      <Command.Group heading={m.search_positions()}>
        {#each groupedResults.positions.slice(0, 3) as result, i (`position-${i}`)}
          <PositionSearchResult data={result.data} />
        {/each}
      </Command.Group>
    {/if}

    {#if groupedResults.members.length > 0}
      <Command.Group heading={m.search_members()}>
        {#each groupedResults.members.slice(0, 3) as result, i (`member-${i}`)}
          <MemberSearchResult data={result.data} />
        {/each}
      </Command.Group>
    {/if}

    {#if groupedResults.events.length > 0}
      <Command.Group heading={m.search_events()}>
        {#each groupedResults.events.slice(0, 3) as result, i (`event-${i}`)}
          <EventSearchResult data={result.data} />
        {/each}
      </Command.Group>
    {/if}

    {#if groupedResults.articles.length > 0}
      <Command.Group heading={m.search_articles()}>
        {#each groupedResults.articles.slice(0, 3) as result, i (`article-${i}`)}
          <ArticleSearchResult data={result.data} />
        {/each}
      </Command.Group>
    {/if}

    {#if groupedResults.songs.length > 0}
      <Command.Group heading={m.search_songs()}>
        {#each groupedResults.songs.slice(0, 3) as result, i (`song-${i}`)}
          <SongSearchResult data={result.data} />
        {/each}
      </Command.Group>
    {/if}

    {#if groupedResults.governingDocuments.length > 0}
      <Command.Group heading={m.search_governing_documents()}>
        {#each groupedResults.governingDocuments.slice(0, 3) as result, i (`govdoc-${i}`)}
          <DocumentSearchResult data={result.data} />
        {/each}
      </Command.Group>
    {/if}

    {#if groupedResults.meetingDocuments.length > 0}
      <Command.Group heading={m.search_meeting_documents()}>
        {#each groupedResults.meetingDocuments.slice(0, 3) as result, i (`meetdoc-${i}`)}
          <DocumentSearchResult data={result.data} />
        {/each}
      </Command.Group>
    {/if}

    {#if input && results.length > 0}
      <Command.Separator />
      <Command.Group>
        <Command.Item
          onSelect={() => {
            open = false;
            // eslint-disable-next-line svelte/no-navigation-without-resolve -- resolve is used, we only add parameters, see sveltejs/kit#14750
            goto(`${resolve("/search")}?q=${encodeURIComponent(input)}`);
          }}
        >
          <Search />
          <span>{m.search_advancedSearch()}</span>
        </Command.Item>
      </Command.Group>
    {/if}
  </Command.List>
</Command.Dialog>
