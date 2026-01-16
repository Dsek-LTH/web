<script lang="ts">
  import * as m from "$paraglide/messages";
  import type {
    ArticleSearchReturnAttributes,
    SearchDataWithType,
  } from "$lib/search/searchTypes";
  import { availableSearchIndexes } from "$lib/search/searchTypes";
  import { enhance } from "$app/forms";
  import { isSearchResultData } from "$lib/utils/search";
  import ArticleSearchResult from "./ArticleSearchResult.svelte";
  import Input from "$lib/components/ui/input/input.svelte";
  import { ScrollArea } from "$lib/components/ui/scroll-area";

  import Search from "@lucide/svelte/icons/search";

  let { open = $bindable(false) } = $props();

  let formElement: HTMLFormElement | null = $state(null);
  let inputElement: HTMLInputElement | null = $state(null);

  let input = $state("");
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
      }, 300);
    }
  }
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
      <!-- TODO: Add an icon here after #1028 gets merged-->
      <Input
        name="input"
        type="text"
        oninput={handleSearch}
        placeholder={m.search_search()}
        bind:value={input}
        bind:ref={inputElement}
        autocomplete="off"><Search /></Input
      >
    </div>
    {#each availableSearchIndexes as index (index)}
      <input type="hidden" name={index} value="on" />
    {/each}
  </form>

  {#if groupedResults.articles.length > 0}
    <ScrollArea
      class="bg-background absolute! mr-4 max-h-48 max-w-108 overflow-scroll rounded-md border-[1px] sm:mr-0 sm:max-w-128 sm:min-w-128"
    >
      {#each groupedResults.articles as result, i (`article-${i}`)}
        <ArticleSearchResult data={result.data} />
      {/each}
    </ScrollArea>
  {/if}
</div>
