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

  let { open = $bindable(false) } = $props();

  let formElement: HTMLFormElement | null = $state(null);
  let inputElement: HTMLInputElement | null = $state(null);
  let listItems: HTMLElement[] = $state([]);
  let advancedSearchElement: HTMLElement | null = $state(null);

  let input = $state("");
  let currentIndex = $state(-1);
  let isSearching = $state(false);
  let timeout: ReturnType<typeof setTimeout> | null = null;
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

  function handleSearch() {
    // Cancel the previous timeout
    if (timeout) clearTimeout(timeout);

    // When user requests a search with empty string
    // Happens when the user deletes the last key of the input
    // We shouldn't search then
    if (!input) {
      isSearching = false;
      results = [];
      return;
    } else {
      // Do the search after 300ms
      timeout = setTimeout(() => {
        formElement?.requestSubmit();
        currentIndex = -1;
      }, 300);
      isSearching = true;
    }
  }

  function captureListItems() {
    // Capture all the search results, and the advanced search link
    const resultElements = Array.from(
      document.querySelectorAll("[data-search-result]"),
    ) as HTMLElement[];

    listItems = advancedSearchElement
      ? [...resultElements, advancedSearchElement]
      : resultElements;
  }

  function handleKeydown(event: KeyboardEvent) {
    // Most probable case first: user just presses a key
    // We should then start searching
    if (
      (open && currentIndex !== -1 && event.key.length === 1) ||
      ((event.key === "Backspace" || event.key === "Delete") &&
        input.length > 0)
    ) {
      isSearching = true;
      inputElement?.focus();
      return;
    }

    // Second most probable case: user presses arrow keys
    if (open && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
      captureListItems();
      event.preventDefault();

      // Move the index based on the key pressed
      if (event.key === "ArrowDown") {
        if (currentIndex + 1 < listItems.length) {
          currentIndex++;
        }
      } else if (event.key === "ArrowUp") {
        if (currentIndex > 0) {
          currentIndex--;
        } else {
          // Focus the input if we're at the top of the list
          currentIndex = -1;
          inputElement?.focus();
          return;
        }
      }
      // Update focus
      listItems[currentIndex]?.focus();
      return;
    }

    // User presses enter
    if (open && event.key === "Enter") {
      captureListItems();
      // If we have a current index, click it
      if (currentIndex !== -1) {
        listItems[currentIndex]?.click();
      }
      event.preventDefault();
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
      currentIndex = -1;
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
      input = "";
      results = [];
      currentIndex = -1;
    }
  });

  export { open };
</script>

<Command.Dialog bind:open shouldFilter={false}>
  <form
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
          bind:ref={advancedSearchElement}
          onSelect={() => {
            open = false;
            goto(`/search?q=${encodeURIComponent(input)}`);
          }}
        >
          <Search />
          <span>{m.search_advancedSearch()}</span>
        </Command.Item>
      </Command.Group>
    {/if}
  </Command.List>
</Command.Dialog>
