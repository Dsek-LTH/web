<script lang="ts">
  import * as Command from "$lib/components/ui/command/index.js";
  import * as m from "$paraglide/messages";
  import type {
    MemberSearchReturnAttributes,
    SearchDataWithType,
  } from "$lib/search/searchTypes";
  import Input from "$lib/components/ui/input/input.svelte";
  import { X } from "@lucide/svelte/icons";
  import MemberCard from "$lib/components/MemberCard.svelte";
  import type { InputProps } from "$lib/components/ui/input";
  import { Button } from "$lib/components/ui/button";
  import MemberResult from "./MemberResult.svelte";
  import { onMount } from "svelte";
  import { cn } from "$lib/utils";

  let {
    selectedMembers = $bindable([]),
    selectedMember = $bindable(null),
    multiple = false,
    limit = 0,
    class: clazz = "",
    ...restProps
  }: {
    selectedMembers?: MemberSearchReturnAttributes[];
    selectedMember?: MemberSearchReturnAttributes | null;
    multiple: boolean;
    limit?: number;
    class?: string;
  } & InputProps = $props();

  let componentElement: HTMLElement | null = $state(null);
  let inputElement: HTMLInputElement | null = $state(null);
  let selectedItemsElement: HTMLElement | null = $state(null);
  let searchResultElement: HTMLElement | null = $state(null);
  let listItems: HTMLElement[] = $state([]);
  let addedItems: HTMLElement[] = $state([]);
  let triggerElement: HTMLElement | null = $state(null);
  let currentIndex = $state(-1);
  let addedItemsIndex = $state(-1);
  let isSearching = $state(false);
  let isFocused = $state(false);

  $effect(() => {
    selectedMember = selectedMembers.length > 0 ? selectedMembers[0]! : null;
  });

  let input = $state("");
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let results: SearchDataWithType[] = $state([]);
  let filteredResults: MemberSearchReturnAttributes[] = $derived<
    MemberSearchReturnAttributes[]
  >(
    results.flatMap((result) => {
      if (result.type !== "members") return [];
      const data = result.data as MemberSearchReturnAttributes;
      return selectedMembers.some((m) => m.studentId === data.studentId)
        ? []
        : [data];
    }),
  );

  async function handleSearch() {
    if (timeout) clearTimeout(timeout);

    if (!input) {
      isSearching = false;
      results = [];
      return;
    } else {
      timeout = setTimeout(async () => {
        if (!input) {
          results = [];
          return;
        }
        const url = new URL("/api/search", window.location.origin);
        url.searchParams.set("query", input);
        url.searchParams.set("indexes", JSON.stringify(["members"]));
        url.searchParams.set("limit", "10");
        url.searchParams.set("offset", "0");
        const response = await fetch(url, {
          method: "GET",
        });

        if (response.ok) {
          results = [...(await response.json())];
        } else {
          results = [];
        }
        isSearching = false;
      }, 300);
      isSearching = true;
    }
  }

  function captureListItems() {
    // Capture all the search results, and the advanced search link
    listItems = Array.from(
      searchResultElement?.querySelectorAll("[data-search-result]") || [],
    ) as HTMLElement[];
  }

  function captureAddedItems() {
    // Capture all the added members
    addedItems = Array.from(
      selectedItemsElement?.querySelectorAll(".added-item") || [],
    ).reverse() as HTMLElement[];
    if (document.activeElement) {
      const index = addedItems.findIndex(
        (item) => item === document.activeElement,
      );
      addedItemsIndex = index;
    } else {
      addedItemsIndex = -1;
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (!isFocused) {
      return;
    }

    // Most probable case first: user just presses a key
    // We should then start searching
    if (
      (currentIndex !== -1 && event.key.length === 1) ||
      ((event.key === "Backspace" || event.key === "Delete") &&
        input.length > 0)
    ) {
      isSearching = true;
      inputElement?.focus();
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
          inputElement?.focus();
          return;
        }
      }
      // Update focus
      listItems[currentIndex]?.focus();
      return;
    }

    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      captureAddedItems();
      if (document.activeElement === inputElement) {
        const start = inputElement?.selectionStart ?? 0;
        const end = inputElement?.selectionEnd ?? 0;

        // Only hijack arrow keys when caret is at the very start and no selection.
        // Otherwise let normal input caret movement happen.
        if (event.key === "ArrowRight" || start !== 0 || end !== 0) {
          return;
        }
      }
      // Move focus to the right or left based on the key pressed
      if (event.key === "ArrowLeft") {
        if (addedItemsIndex + 1 < addedItems.length) {
          addedItemsIndex++;
          addedItems[addedItemsIndex]?.focus();
        }
      } else if (event.key === "ArrowRight") {
        if (addedItemsIndex > 0) {
          addedItemsIndex--;
          addedItems[addedItemsIndex]?.focus();
        } else {
          // Focus the input if we're at the start of the list
          addedItemsIndex = -1;
          inputElement?.focus();
        }
      }
      event.preventDefault();
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

    if (event.key === "Backspace" || event.key === "Delete") {
      if (input.length === 0 && selectedMembers.length > 0) {
        if (addedItemsIndex !== -1) {
          // If we have a current added item index, remove that member
          const memberToRemove =
            selectedMembers[selectedMembers.length - 1 - addedItemsIndex];
          if (memberToRemove) {
            removeMember(memberToRemove);
          }
          if (addedItemsIndex > 0) {
            addedItemsIndex--;
            addedItems[addedItemsIndex]?.focus();
          } else {
            addedItemsIndex = -1;
            inputElement?.focus();
          }
        } else {
          // Otherwise, remove the last member
          const memberToRemove = selectedMembers[selectedMembers.length - 1];
          if (memberToRemove) {
            removeMember(memberToRemove);
          }
        }
      }
    }
  }

  onMount(() => {
    document.addEventListener("keydown", handleKeydown);
    return () => {
      document.removeEventListener("keydown", handleKeydown);
    };
  });

  function handleComponentFocusOut(event: FocusEvent) {
    const next = event.relatedTarget as Node | null;

    // Still inside the component -> keep results open
    if (next && componentElement?.contains(next)) return;

    // Wait one tick so activeElement is updated (mouse/tab)
    setTimeout(() => {
      if (!componentElement?.contains(document.activeElement)) {
        results = [];
        currentIndex = -1;
        isFocused = false;
      }
    }, 0);
  }

  function handleFocusIn() {
    isFocused = true;
    if (input) {
      handleSearch();
    }
  }

  function addMember(member: MemberSearchReturnAttributes) {
    selectedMembers = [...selectedMembers, member];
    input = "";
    inputElement?.focus();
    if (inputElement) inputElement.value = "";
    results = [];
  }

  function removeMember(member: MemberSearchReturnAttributes) {
    selectedMembers = selectedMembers.filter(
      (mem) => mem.studentId !== member.studentId,
    );
  }
</script>

<div
  bind:this={componentElement}
  onfocusout={handleComponentFocusOut}
  onfocusin={handleFocusIn}
  class="w-fit"
>
  <Command.Root
    shouldFilter={false}
    class={cn("relative w-fit overflow-visible p-0", clazz)}
    {...restProps}
  >
    <Button
      bind:ref={triggerElement}
      variant="outline"
      class={cn("align-center h-fit w-fit cursor-text justify-start p-1 px-2")}
      onclick={() => {
        inputElement?.focus();
      }}
    >
      <ul
        class="m-0 flex w-fit list-none flex-row flex-wrap gap-2"
        bind:this={selectedItemsElement}
      >
        {#each selectedMembers as member (member.studentId)}
          <li class="relative m-0 list-none">
            <Button
              variant="ghost"
              class="added-item hover:bg-muted bg-background h-full cursor-pointer rounded-full p-0"
              onclick={() => removeMember(member)}
            >
              <MemberCard {member} links={false} class="rounded-full p-1 pr-2">
                <X class="h-4 w-4" />
              </MemberCard>
            </Button>
          </li>
        {/each}
        {#if (multiple && (limit == 0 || selectedMembers.length < limit)) || selectedMembers.length === 0}
          <li class="relative m-0 flex max-w-full list-none p-0">
            <Input
              name="input"
              type="none"
              class="mx-0 h-full w-fit border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
              placeholder={multiple
                ? m.select_members().concat(limit > 0 ? ` (max ${limit})` : "")
                : m.select_member()}
              bind:value={input}
              bind:ref={inputElement}
              oninput={handleSearch}
              autocomplete="off"
            />
            {#if input && isFocused}
              <Command.List
                class="bg-popover absolute top-full z-50 mt-2 max-h-64 w-max overflow-auto rounded-md border-[1px] shadow-md"
                style="
                  max-width: calc(100vw - 2rem);
                  margin-left:
                    min(
                      -0.5rem,
                      calc(100vw - {searchResultElement?.getBoundingClientRect()
                  .width ?? 0}px - {inputElement?.getBoundingClientRect()
                  .left ?? 0}px - 1rem)
                  );
                "
                bind:ref={searchResultElement}
              >
                <Command.Empty class="p-4 pb-2 text-center text-sm">
                  {isSearching ? m.search_searching() : m.search_noResults()}
                </Command.Empty>
                <Command.Group class="w-full p-2 pb-0">
                  {#each filteredResults as result (result.studentId)}
                    <Command.Item
                      data-search-result
                      onclick={() => addMember(result)}
                      class="mb-2 w-full cursor-pointer rounded-full p-0"
                    >
                      <MemberResult data={result} class="w-full" />
                    </Command.Item>
                  {/each}
                </Command.Group>
              </Command.List>
            {/if}
          </li>
        {/if}
      </ul>
    </Button>
  </Command.Root>
</div>
