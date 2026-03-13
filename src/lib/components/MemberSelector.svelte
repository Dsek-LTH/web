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

  let inputElement: HTMLInputElement | null = $state(null);
  let listItems: HTMLElement[] = $state([]);
  let advancedSearchElement: HTMLElement | null = $state(null);

  let currentIndex = $state(-1);

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
    if (
      document.activeElement !== inputElement &&
      document.activeElement !== advancedSearchElement &&
      !listItems.includes(document.activeElement as HTMLElement)
    ) {
      return;
    }

    // Most probable case first: user just presses a key
    // We should then start searching
    if (
      (currentIndex !== -1 && event.key.length === 1) ||
      ((event.key === "Backspace" || event.key === "Delete") &&
        input.length > 0)
    ) {
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
        // Remove the last member if input is empty
        selectedMembers = selectedMembers.slice(0, -1);
      }
    }
  }

  onMount(() => {
    document.addEventListener("keydown", handleKeydown);
    return () => {
      document.removeEventListener("keydown", handleKeydown);
    };
  });

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

<Command.Root
  shouldFilter={false}
  class={cn("bg-popover p-0", clazz, multiple ? " w-full" : " w-fit")}
  {...restProps}
>
  <Button
    variant="outline"
    class={cn(
      "align-center flex h-fit cursor-text flex-row flex-wrap justify-start p-1 pl-2",
      filteredResults.length > 0 ? "rounded-b-none" : "",
    )}
    onclick={() => {
      inputElement?.focus();
    }}
  >
    <ul class="m-0 flex w-full list-none flex-row flex-wrap gap-2">
      {#each selectedMembers as member (member.studentId)}
        <li class="relative m-0 list-none">
          <button
            type="button"
            class="hover:bg-muted h-full cursor-pointer"
            onclick={() => removeMember(member)}
          >
            <MemberCard {member} links={false} class="rounded-full p-1 pr-2">
              <X class="h-4 w-4" />
            </MemberCard>
          </button>
        </li>
      {/each}
      {#if (multiple && (limit == 0 || selectedMembers.length < limit)) || selectedMembers.length === 0}
        <li class="relative m-0 flex w-full flex-1 list-none p-0">
          <Input
            name="input"
            type="none"
            class="mx-0 h-full w-full border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
            placeholder={multiple
              ? m.select_members().concat(limit > 0 ? ` (max ${limit})` : "")
              : m.select_member()}
            bind:value={input}
            bind:ref={inputElement}
            oninput={handleSearch}
            autocomplete="off"
          />
        </li>
      {/if}
    </ul>
  </Button>

  {#if filteredResults.length > 0}
    <Command.List class="rounded-b-md border-[1px]">
      <Command.Group class="p-2 pb-0">
        {#each filteredResults as result (result.studentId)}
          <Command.Item
            onclick={() => addMember(result)}
            class={cn("mb-2 w-full cursor-pointer rounded-full p-0")}
          >
            <MemberResult data={result} class="w-full" />
          </Command.Item>
        {/each}
      </Command.Group>
    </Command.List>
  {/if}
</Command.Root>
