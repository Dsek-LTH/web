<script lang="ts">
  import { enhance } from "$app/forms";
  import * as m from "$paraglide/messages";
  import type { ActionData } from "./$types";
  import SearchResultList from "$lib/components/search/SearchResultList.svelte";
  import { availableSearchIndexes } from "$lib/search/searchTypes";
  import { mapIndexToMessage } from "$lib/search/searchHelpers";

  export let form: ActionData;
  let formElement: HTMLFormElement;
  let inputElement: HTMLInputElement;
  let listItems: HTMLAnchorElement[] = [];
  let currentIndex = -1;
  let isSearching = false;

  $: noResults = form?.results?.length === 0;

  $: toSearchOn = availableSearchIndexes.map((index) => {
    return {
      index,
      include: true,
    };
  });

  // Call handleSearch whenever checkboxes change
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions -- This syntax is valid and it's a good use case here
  $: toSearchOn && handleSearch();

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
    if (form) {
      form.results = [];
      form.message = undefined;
    }
  }

  function onKeyDown(event: KeyboardEvent) {
    // Most probable case first: user just presses a key
    // We should then start searcing
    // (the actual search is executed by input on:input)
    if (
      (currentIndex !== -1 && event.key.length === 1) ||
      ((event.key === "Backspace" || event.key === "Delete") &&
        input.length > 0)
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
    listItems = Array.from(formElement?.querySelectorAll("a")).filter(
      (a) => a.id === ".search-result",
    );
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
    {#each toSearchOn as index}
      <div class="flex items-center gap-2">
        <input
          type="checkbox"
          class="checkbox checkbox-sm"
          id={index.index}
          name={index.index}
          bind:checked={index.include}
        />
        <label for={index.index}>{mapIndexToMessage(index.index)}</label>
      </div>
    {/each}
  </div>
  <button class="btn sr-only mb-2 w-full">{m.search_search()}</button>
  {#if form?.results?.length}
    <div class="menu rounded-box bg-base-200">
      <SearchResultList results={form?.results} />
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
  {#if form?.message}
    <div class="alert alert-error mt-4">
      Error: {JSON.stringify(form)}
    </div>
  {/if}
</form>
