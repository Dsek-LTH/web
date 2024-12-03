<script lang="ts">
  import { enhance } from "$app/forms";
  import * as m from "$paraglide/messages";
  import type { ActionData } from "./$types";
  import ArticleSearchResult from "$lib/components/search/ArticleSearchResult.svelte";
  import EventSearchResult from "$lib/components/search/EventSearchResult.svelte";
  import MemberSearchResult from "$lib/components/search/MemberSearchResult.svelte";
  import PositionSearchResult from "$lib/components/search/PositionSearchResult.svelte";
  import SongSearchResult from "$lib/components/search/SongSearchResult.svelte";

  export let form: ActionData;
  let formElement: HTMLFormElement;
  let inputElement: HTMLInputElement;
  let listItems: HTMLAnchorElement[] = [];
  let currentIndex = -1;
  let isSearching = false;

  $: noResults = form?.results.length === 0;

  $: includeMembers = true;
  $: includePositions = true;
  $: includeArticles = true;
  $: includeEvents = true;
  $: includeSongs = true;

  // Call handleSearch whenever checkboxes change
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions -- This syntax is valid and it's a good use case here
  $: includeMembers &&
    includePositions &&
    includeArticles &&
    includeEvents &&
    includeSongs &&
    handleSearch();

  let timeout: ReturnType<typeof setTimeout> | null = null;
  let input = "";

  function handleSearch() {
    if (!input) {
      reset();
      return;
    }
    // Cancel the previous timeout
    if (timeout) clearTimeout(timeout);
    // Do the search after 300ms
    timeout = setTimeout(() => {
      formElement.requestSubmit();
      currentIndex = -1;
    }, 300);
    isSearching = true;
  }

  function reset() {
    isSearching = false;
    if (form) form.results = [];
  }

  function onKeyDown(event: KeyboardEvent) {
    // Most probable case first: user just presses a key
    // We should then start searcing
    // (the actual search is executed by input on:input)
    if (
      (currentIndex !== -1 && event.key.length === 1) ||
      event.key === "Backspace" ||
      event.key === "Delete"
    ) {
      isSearching = true;
      inputElement.focus();
      return;
    }

    // Second most probable case: user presses arrow keys
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
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
          inputElement.focus();
          return;
        }
      }
      // Update focus
      listItems[currentIndex]?.focus();
      return;
    }

    // User presses enter
    if (event.key === "Enter") {
      captureListItems();
      // If we have a current index, click it
      if (currentIndex !== -1) {
        listItems[currentIndex]?.click();
      }
      event.preventDefault();
      return;
    }
  }

  function captureListItems() {
    // Query all anchor elements inside the form
    listItems = Array.from(formElement?.querySelectorAll("a"));
  }
</script>

<svelte:window on:keydown={onKeyDown} />

<form
  method="POST"
  class="mx-auto mt-8 max-w-lg"
  bind:this={formElement}
  use:enhance={async () => {
    return async ({ update }) => {
      await update({
        reset: false,
      });
      isSearching = false;
    };
  }}
>
  <label class="input input-bordered mb-2 flex items-center gap-2">
    <span class="i-mdi-magnify size-6"></span>
    <!-- svelte-ignore a11y-autofocus -->
    <input
      autofocus
      type="text"
      name="input"
      placeholder={m.search_search()}
      class="grow bg-transparent"
      autocomplete="off"
      bind:this={inputElement}
      bind:value={input}
      on:input={handleSearch}
    />
    {#if isSearching}
      <span class="loading loading-sm"></span>
    {/if}
  </label>
  <div class="mb-2 flex flex-wrap gap-4 p-2">
    <div class="flex items-center gap-2">
      <input
        type="checkbox"
        class="checkbox checkbox-sm"
        id="members"
        name="members"
        bind:checked={includeMembers}
      />
      <label for="members">{m.search_members()}</label>
    </div>
    <div class="flex items-center gap-2">
      <input
        type="checkbox"
        class="checkbox checkbox-sm"
        id="positions"
        name="positions"
        bind:checked={includePositions}
      />
      <label for="positions">{m.search_positions()}</label>
    </div>
    <div class="flex items-center gap-2">
      <input
        type="checkbox"
        class="checkbox checkbox-sm"
        id="articles"
        name="articles"
        bind:checked={includeArticles}
      />
      <label for="articles">{m.search_articles()}</label>
    </div>
    <div class="flex items-center gap-2">
      <input
        type="checkbox"
        class="checkbox checkbox-sm"
        id="events"
        name="events"
        bind:checked={includeEvents}
      />
      <label for="events">{m.search_events()}</label>
    </div>
    <div class="flex items-center gap-2">
      <input
        type="checkbox"
        class="checkbox checkbox-sm"
        id="songs"
        name="songs"
        bind:checked={includeSongs}
      />
      <label for="songs">{m.search_songs()}</label>
    </div>
  </div>
  <button class="btn sr-only mb-2 w-full">{m.search_search()}</button>
  {#if form?.results?.length}
    <div class="menu rounded-box bg-base-200">
      {#each form?.results as searchValue}
        {#if searchValue.type === "members"}
          <MemberSearchResult member={searchValue.data} />
        {:else if searchValue.type === "positions"}
          <PositionSearchResult position={searchValue.data} />
        {:else if searchValue.type === "articles"}
          <ArticleSearchResult article={searchValue.data} />
        {:else if searchValue.type === "events"}
          <EventSearchResult event={searchValue.data} />
        {:else if searchValue.type === "songs"}
          <SongSearchResult song={searchValue.data} />
        {/if}
      {/each}
    </div>
  {:else if !isSearching && input.length > 0 && noResults}
    <div class="menu rounded-box bg-base-200">
      <li>
        <p class="menu-title p-4">
          {m.search_noResults()} :(
        </p>
      </li>
    </div>
  {/if}
</form>
