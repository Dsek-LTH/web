<script lang="ts">
  import * as Command from "$lib/components/ui/command/index.js";
  import * as Avatar from "$lib/components/ui/avatar/index.js";
  import * as m from "$paraglide/messages";
  import type {
    PositionSearchReturnAttributes,
    SearchDataWithType,
  } from "$lib/search/searchTypes";
  import Input from "$lib/components/ui/input/input.svelte";
  import { X } from "@lucide/svelte/icons";
  import CommitteeIcon from "$lib/components/images/CommitteeIcon.svelte";
  import type { InputProps } from "$lib/components/ui/input";
  import { Button } from "$lib/components/ui/button";
  import { onMount } from "svelte";
  import { cn } from "$lib/utils";
  import { debounce } from "$lib/utils/debounce";
  import { getLocale } from "$paraglide/runtime";
  import { programmes } from "$lib/utils/programmes";

  export type RoleOption = {
    id: string;
    label: string;
    sublabel?: string;
    committee?: PositionSearchReturnAttributes["committee"];
  };

  let {
    selectedRoles = $bindable([]),
    selectedRole = $bindable(null),
    multiple = false,
    limit = 0,
    name = undefined,
    class: klass = "",
    inputClass = "",
    ...restProps
  }: {
    selectedRoles?: RoleOption[];
    selectedRole?: RoleOption | null;
    multiple: boolean;
    limit?: number;
    /**
     * When set, renders hidden input(s) carrying the selected role's raw
     * id (one per selected role when `multiple`), so this component can
     * be used inside a plain <form> and submit without JS.
     */
    name?: string;
    class?: string;
    inputClass?: string;
  } & InputProps = $props();

  const YEARS_BACK = 6;
  const virtualRoles: RoleOption[] = (() => {
    const currentYear = new Date().getFullYear();
    const base: RoleOption[] = [
      { id: "*", label: m.role_everyone() },
      { id: "_", label: m.role_signedIn() },
      { id: "nolla", label: m.role_nolla() },
      { id: "dsek.styr", label: m.role_boardMembers() },
    ];
    const programmeRoles = programmes.flatMap((programme) =>
      Array.from({ length: YEARS_BACK + 1 }, (_, i) => {
        const year = currentYear - i;
        const shortYear = String(year % 100).padStart(2, "0");
        return {
          id: `${programme.id}${shortYear}`,
          label: `${programme.name} ${year}`,
        };
      }),
    );
    return [...base, ...programmeRoles];
  })();

  let componentElement: HTMLElement | null = $state(null);
  let inputElement: HTMLInputElement | null = $state(null);
  let selectedItemsElement: HTMLElement | null = $state(null);
  let searchResultElement: HTMLElement | null = $state(null);
  let isSearching = $state(false);

  $effect(() => {
    selectedRole = selectedRoles.length > 0 ? selectedRoles[0]! : null;
  });

  function isFocused(): boolean {
    return componentElement?.contains(document.activeElement) ?? false;
  }

  let input = $state("");
  let positionResults: SearchDataWithType[] = $state([]);

  let filteredVirtualRoles: RoleOption[] = $derived(
    input
      ? virtualRoles.filter(
          (role) =>
            !selectedRoles.some((r) => r.id === role.id) &&
            (role.id.toLowerCase().includes(input.toLowerCase()) ||
              role.label.toLowerCase().includes(input.toLowerCase())),
        )
      : [],
  );

  let filteredPositionRoles: RoleOption[] = $derived(
    positionResults.flatMap((result) => {
      if (result.type !== "positions") return [];
      const data = result.data as PositionSearchReturnAttributes;
      const role: RoleOption = {
        id: data.dsekId,
        label: (getLocale() === "sv" ? data.nameSv : data.nameEn) ?? data.dsekId,
        sublabel:
          (getLocale() === "sv" ? data.committeeNameSv : data.committeeNameEn) ??
          undefined,
        committee: data.committee,
      };
      return selectedRoles.some((r) => r.id === role.id) ? [] : [role];
    }),
  );

  const debouncedSearch = debounce(async (searchQuery: string) => {
    const url = new URL("/api/search", window.location.origin);
    url.searchParams.set("query", searchQuery);
    url.searchParams.set("indexes", JSON.stringify(["positions"]));
    url.searchParams.set("limit", "10");
    url.searchParams.set("offset", "0");
    const response = await fetch(url, { method: "GET" });
    positionResults = response.ok ? [...(await response.json())] : [];
    isSearching = false;
  }, 200);

  function handleSearch() {
    if (!input) {
      debouncedSearch.cancel();
      isSearching = false;
      positionResults = [];
      return;
    }
    isSearching = true;
    debouncedSearch(input);
  }

  function handleComponentFocusOut(event: FocusEvent) {
    const next = event.relatedTarget as Node | null;
    if (next && componentElement?.contains(next)) return;
    setTimeout(() => {
      if (!componentElement?.contains(document.activeElement)) {
        positionResults = [];
      }
    }, 0);
  }

  function handleFocusIn() {
    if (input) handleSearch();
  }

  function addRole(role: RoleOption) {
    selectedRoles = [...selectedRoles, role];
    input = "";
    inputElement?.focus();
    if (inputElement) inputElement.value = "";
    positionResults = [];
  }

  function removeRole(role: RoleOption) {
    selectedRoles = selectedRoles.filter((r) => r.id !== role.id);
  }

  onMount(() => {
    function handleKeydown(event: KeyboardEvent) {
      if (!isFocused()) return;
      if (
        (event.key === "Backspace" || event.key === "Delete") &&
        input.length === 0 &&
        selectedRoles.length > 0
      ) {
        removeRole(selectedRoles[selectedRoles.length - 1]!);
      }
    }
    document.addEventListener("keydown", handleKeydown);
    return () => document.removeEventListener("keydown", handleKeydown);
  });
</script>

<Command.Root
  bind:ref={componentElement}
  onfocusout={handleComponentFocusOut}
  onfocusin={handleFocusIn}
  shouldFilter={false}
  loop
  class={cn(klass, "relative w-fit overflow-visible p-0")}
  {...restProps}
>
  <Button
    variant="outline"
    class={cn(
      "align-center h-fit w-full cursor-text justify-start p-1 px-2",
      inputClass,
    )}
    onclick={() => inputElement?.focus()}
  >
    <ul
      class="m-0 flex w-fit list-none flex-row flex-wrap gap-2"
      bind:this={selectedItemsElement}
    >
      {#if name}
        {#if multiple}
          {#each selectedRoles as role (role.id)}
            <input type="hidden" {name} value={role.id} />
          {/each}
        {:else}
          <input type="hidden" {name} value={selectedRole?.id ?? ""} />
        {/if}
      {/if}
      {#each selectedRoles as role (role.id)}
        <li class="relative m-0 list-none">
          <Button
            variant="ghost"
            class="hover:bg-muted bg-background h-full cursor-pointer gap-1 rounded-full p-1 pr-2"
            onclick={() => removeRole(role)}
          >
            {#if role.committee}
              <Avatar.Root class="size-5">
                <CommitteeIcon committee={role.committee} class="size-5" />
              </Avatar.Root>
            {/if}
            <span class="font-mono text-sm">{role.label}</span>
            <X class="h-4 w-4" />
          </Button>
        </li>
      {/each}
      {#if (multiple && (limit == 0 || selectedRoles.length < limit)) || selectedRoles.length === 0}
        <li class="relative m-0 flex max-w-full list-none p-0">
          <Input
            name="input"
            type="none"
            class="mx-0 h-full w-fit border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
            placeholder={multiple
              ? m.select_roles().concat(limit > 0 ? ` (max ${limit})` : "")
              : m.select_role()}
            bind:value={input}
            bind:ref={inputElement}
            oninput={handleSearch}
            autocomplete="off"
          />
          {#if input && isFocused()}
            <Command.List
              class="bg-popover absolute top-full z-50 mt-2 max-h-64 w-max overflow-auto rounded-md border-[1px] shadow-md"
              style="
                  max-width: calc(100vw - 2rem);
                  margin-left:
                    min(
                      -0.5rem,
                      calc(100vw - {searchResultElement?.getBoundingClientRect()
                .width ?? 0}px - {inputElement?.getBoundingClientRect().left ??
                0}px - 1rem)
                    );
                "
              bind:ref={searchResultElement}
            >
              <Command.Empty class="p-4 pb-2 text-center text-sm">
                {isSearching ? m.search_searching() : m.search_noResults()}
              </Command.Empty>
              {#if filteredVirtualRoles.length > 0}
                <Command.Group
                  heading={m.role_specialRoles()}
                  class="w-full p-2 pb-0"
                >
                  {#each filteredVirtualRoles as role (role.id)}
                    <Command.Item
                      data-search-result
                      onclick={() => addRole(role)}
                      class="mb-2 flex w-full cursor-pointer items-center justify-between rounded-md p-2 opacity-80 data-selected:opacity-100"
                    >
                      <span>{role.label}</span>
                      <span class="text-muted-foreground font-mono text-xs"
                        >{role.id}</span
                      >
                    </Command.Item>
                  {/each}
                </Command.Group>
              {/if}
              {#if filteredPositionRoles.length > 0}
                <Command.Group
                  heading={m.role_positions()}
                  class="w-full p-2 pb-0"
                >
                  {#each filteredPositionRoles as role (role.id)}
                    <Command.Item
                      data-search-result
                      onclick={() => addRole(role)}
                      class="mb-2 flex w-full cursor-pointer items-center gap-2 rounded-md p-2 opacity-80 data-selected:opacity-100"
                    >
                      {#if role.committee}
                        <Avatar.Root class="size-6 shrink-0">
                          <CommitteeIcon committee={role.committee} />
                        </Avatar.Root>
                      {/if}
                      <div class="flex flex-col items-start">
                        <span>{role.label}</span>
                        {#if role.sublabel}
                          <span class="text-muted-foreground text-xs"
                            >{role.sublabel}</span
                          >
                        {/if}
                      </div>
                    </Command.Item>
                  {/each}
                </Command.Group>
              {/if}
            </Command.List>
          {/if}
        </li>
      {/if}
    </ul>
  </Button>
</Command.Root>
