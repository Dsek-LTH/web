<script lang="ts">
  import * as Command from "$lib/components/ui/command/index.js";
  import * as Popover from "$lib/components/ui/popover/index.js";
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
  import { onMount } from "svelte";
  import { cn } from "$lib/utils";
  import { debounce } from "$lib/utils/debounce";

  let {
    selectedMembers = $bindable([]),
    selectedMembersIds = $bindable([]),
    selectedMember = $bindable(null),
    selectedMemberId = $bindable(null),
    multiple = false,
    showId = true,
    showClass = true,
    showNickname = true,
    limit = 0,
    name = undefined,
    class: klass = "",
    inputClass = "",
    onchange = $bindable(),
    onremove = $bindable(),
    ...restProps
  }: {
    selectedMembers?: Array<MemberSearchReturnAttributes & { id?: string }>;
    selectedMembersIds?: string[] | null;
    selectedMember?: (MemberSearchReturnAttributes & { id?: string }) | null;
    selectedMemberId?: string | null;
    multiple: boolean;
    showId: boolean;
    showClass: boolean;
    showNickname?: boolean;
    limit?: number;
    /**
     * When set, renders hidden input(s) carrying the selected member's
     * studentId (one per selected member when `multiple`), so this
     * component can be used inside a plain <form> and submit without JS.
     */
    name?: string;
    class?: string;
    inputClass?: string;
    onchange?: () => void;
    onremove?: () => void;
  } & InputProps = $props();

  let componentElement: HTMLElement | null = $state(null);
  let inputElement: HTMLInputElement | null = $state(null);
  let selectedItemsElement: HTMLElement | null = $state(null);
  let popoverContentElement: HTMLElement | null = $state(null);
  let addedItems: HTMLElement[] = $state([]);
  let triggerElement: HTMLElement | null = $state(null);
  let addedItemsIndex = $state(-1);
  let isSearching = $state(false);

  // Make sure the popover gets the correct z-index.
  let inDialog = $derived(
    !!(componentElement as HTMLElement | null)?.closest(
      '[data-slot="dialog-content"]',
    ),
  );

  $effect(() => {
    if (selectedMember?.id) {
      if (selectedMember.id.includes("-")) {
        selectedMemberId = selectedMember.id;
      } else {
        selectedMemberId = new TextDecoder().decode(
          base64ToBytes(selectedMember?.id),
        );
      }
    }
    if (selectedMembers) {
      selectedMembersIds = selectedMembers
        .filter((m) => !m.id?.includes("-"))
        .map((m) => new TextDecoder().decode(base64ToBytes(m.id!)));
    }
  });

  const base64ToBytes = (input: string) =>
    Uint8Array.from(atob(input), (c) => c.charCodeAt(0)).buffer;

  function isFocused(): boolean {
    return componentElement?.contains(document.activeElement) ?? false;
  }

  $effect(() => {
    selectedMember = selectedMembers.length > 0 ? selectedMembers[0]! : null;
  });

  let input = $state("");
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

  const debouncedSearch = debounce(async (searchQuery: string) => {
    const url = new URL("/api/search", window.location.origin);
    url.searchParams.set("query", searchQuery);
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
  }, 200);

  function handleSearch() {
    if (!input) {
      debouncedSearch.cancel();
      isSearching = false;
      results = [];
      return;
    }
    isSearching = true;
    debouncedSearch(input);
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
    if (!isFocused()) {
      return;
    }

    // Most probable case first: user just presses a key
    // We should then start searching
    if (
      event.key.length === 1 ||
      ((event.key === "Backspace" || event.key === "Delete") &&
        input.length > 0)
    ) {
      isSearching = true;
      inputElement?.focus();
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

    // Still inside the component (or its portaled results) -> keep results open
    if (
      next &&
      (componentElement?.contains(next) ||
        popoverContentElement?.contains(next))
    )
      return;

    // Wait one tick so activeElement is updated (mouse/tab)
    setTimeout(() => {
      if (
        !componentElement?.contains(document.activeElement) &&
        !popoverContentElement?.contains(document.activeElement)
      ) {
        results = [];
      }
    }, 0);
  }

  function handleFocusIn() {
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
    onremove?.();
  }
</script>

<Command.Root
  bind:ref={componentElement}
  onfocusout={handleComponentFocusOut}
  onfocusin={handleFocusIn}
  shouldFilter={false}
  loop
  class={cn(klass, "relative w-full overflow-visible p-0")}
  {...restProps}
>
  <Button
    bind:ref={triggerElement}
    tabindex={-1}
    variant="outline"
    class={cn(
      "align-center bg-background h-fit w-full cursor-text justify-start p-1 px-2 transition-all ",
      "focus-within:border-muted-foreground focus-within:ring-muted-foreground/20 hover:bg-background focus-within:ring-[3px]",
      inputClass,
    )}
    onclick={() => {
      inputElement?.focus();
    }}
  >
    <ul
      class="m-0 flex w-full list-none flex-row flex-wrap gap-2"
      bind:this={selectedItemsElement}
    >
      {#if name}
        {#if multiple}
          {#each selectedMembers as member (member.studentId)}
            <input type="hidden" {name} value={member.studentId} />
          {/each}
        {:else}
          <input type="hidden" {name} value={selectedMember?.studentId ?? ""} />
        {/if}
      {/if}
      {#each selectedMembers as member (member.studentId)}
        <li class="relative m-0 list-none">
          <Button
            variant="ghost"
            class="added-item hover:bg-muted bg-background h-full cursor-pointer rounded-full p-0"
            onclick={() => removeMember(member)}
          >
            <MemberCard
              {member}
              nickname={showNickname}
              links={false}
              class="rounded-full p-1 pr-2"
            >
              <X class="h-4 w-4" />
            </MemberCard>
          </Button>
        </li>
      {/each}
      {#if (multiple && (limit == 0 || selectedMembers.length < limit)) || selectedMembers.length === 0}
        <li class="relative m-0 flex min-w-24 flex-1 list-none p-0">
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
            {onchange}
          />
          <!-- Portaled to <body> so ancestor overflow/stacking can't clip it -->
          <Popover.Root
            bind:open={() => !!input && isFocused(), () => undefined}
          >
            <Popover.Content
              bind:ref={popoverContentElement}
              customAnchor={triggerElement}
              align="start"
              sideOffset={8}
              trapFocus={false}
              onOpenAutoFocus={(e) => e.preventDefault()}
              onCloseAutoFocus={(e) => e.preventDefault()}
              onInteractOutside={(e) => {
                // Clicking the input/chips is not "outside"
                if (
                  e.target instanceof Node &&
                  componentElement?.contains(e.target)
                ) {
                  e.preventDefault();
                }
              }}
              onmousedown={(e) => e.preventDefault()}
              class={cn(
                "w-max max-w-[calc(100vw-2rem)] p-0",
                inDialog ? "z-250" : "z-10",
              )}
            >
              <Command.List class="max-h-64 overflow-auto">
                <Command.Empty class="p-4 pb-2 text-center text-sm">
                  {isSearching ? m.search_searching() : m.search_noResults()}
                </Command.Empty>
                <Command.Group class="w-full p-2 pb-0">
                  {#each filteredResults as result (result.studentId)}
                    <Command.Item
                      onclick={() => addMember(result)}
                      class="mb-2 w-full cursor-pointer rounded-full p-0 opacity-80 data-selected:opacity-100"
                    >
                      <MemberCard
                        member={result}
                        links={false}
                        nickname={showNickname}
                        {showId}
                        {showClass}
                        class="w-full rounded-full p-1 pr-2  "
                      />
                    </Command.Item>
                  {/each}
                </Command.Group>
              </Command.List>
            </Popover.Content>
          </Popover.Root>
        </li>
      {/if}
    </ul>
  </Button>
</Command.Root>
