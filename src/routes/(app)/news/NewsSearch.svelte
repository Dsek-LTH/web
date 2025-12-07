<script lang="ts">
  import * as m from "$paraglide/messages";
  import type {
    ArticleSearchReturnAttributes,
    SearchDataWithType,
  } from "$lib/search/searchTypes";
  import { availableSearchIndexes } from "$lib/search/searchTypes";
  import { onMount } from "svelte";
  import { enhance } from "$app/forms";
  import { isSearchResultData } from "$lib/utils/search";
  import ArticleSearchResult from "./ArticleSearchResult.svelte";
  import Input from "$lib/components/ui/input/input.svelte";
  import { ScrollArea } from "$lib/components/ui/scroll-area";

  let { open = $bindable(false) } = $props();

  let formElement: HTMLFormElement | null = $state(null);
  let inputElement: HTMLInputElement | null = $state(null);
  let listItems: HTMLElement[] = $state([]);
  let advancedSearchElement: HTMLElement | null = $state(null);

  let input = $state("");
  let currentIndex = $state(-1);
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let results: SearchDataWithType[] = $state([]);

  let groupedResults = $derived<{
    articles: Array<{ type: "articles"; data: ArticleSearchReturnAttributes }>;
  }>({
    articles: results.filter((r) => r.type === "articles"),
  });

  function handleSearch() {
    // Cancel the previous timeout
    if (timeout) clearTimeout(timeout);

    // When user requests a search with empty string
    // Happens when the user deletes the last key of the input
    // We shouldn't search then
    if (!input) {
      results = [];
      return;
    } else {
      // Do the search after 300ms
      timeout = setTimeout(() => {
        formElement?.requestSubmit();
        currentIndex = -1;
      }, 300);
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
  }

  onMount(() => {
    document.addEventListener("keydown", handleKeydown);
    return () => {
      document.removeEventListener("keydown", handleKeydown);
    };
  });

  export { open };
</script>

<div>
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
      };
    }}
  >
    <div class="flex flex-row">
      <Input
        name="input"
        type="text"
        oninput={handleSearch}
        placeholder={m.search_search()}
        bind:value={input}
        bind:ref={inputElement}
        autocomplete="off"
      />
    </div>
    {#each availableSearchIndexes as index (index)}
      <input type="hidden" name={index} value="on" />
    {/each}
  </form>

  {#if groupedResults.articles.length > 0}
    <ScrollArea
      class="bg-background absolute! mr-4 h-48 max-w-108 rounded-md border-[1px] sm:mr-0 sm:max-w-128"
    >
      {#each groupedResults.articles as result, i (`article-${i}`)}
        <ArticleSearchResult data={result.data} />
      {/each}
    </ScrollArea>
  {/if}
</div>
