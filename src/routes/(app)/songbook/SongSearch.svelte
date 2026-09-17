<script lang="ts">
  import * as m from "$paraglide/messages.js";
  import * as Popover from "$lib/components/ui/popover/index.js";
  import * as Command from "$lib/components/ui/command/index.js";
  import { CheckIcon, ChevronsUpDownIcon } from "@lucide/svelte";
  import { cn } from "$lib/utils.js";
  import { searchSongTitles } from "./data.remote.js";
  import { Button } from "$lib/components/ui/button";
  import { tick } from "svelte";

  let { songId = $bindable(), title }: { songId: string; title?: string } =
    $props();

  let open = $state(false);
  let triggerRef = $state<HTMLButtonElement>(null!);

  // Remote Fetch State
  let searchQuery = $state("");
  let isFetching = $state(false);
  let searchResults = $state<Array<{ id: string; title: string }>>([]);
  let debounceTimer: ReturnType<typeof setTimeout>;

  const selectedLabel = $derived.by(() => {
    const foundInSearch = searchResults.find((s) => s.id === songId);
    if (foundInSearch) return foundInSearch.title;

    return title || "";
  });

  // Debounced search effect
  $effect(() => {
    // Clear previous timer on every keystroke
    clearTimeout(debounceTimer);

    // Don't search if query is empty or too short
    if (searchQuery.trim().length < 2) {
      searchResults = [];
      return;
    }

    // Set a 300ms delay before hitting the server
    debounceTimer = setTimeout(async () => {
      isFetching = true;
      try {
        searchResults = await searchSongTitles(searchQuery.trim());
      } catch (error) {
        console.error("Failed to fetch songs", error);
      } finally {
        isFetching = false;
      }
    }, 300);
  });

  function closeAndFocusTrigger() {
    open = false;
    tick().then(() => {
      triggerRef.focus();
    });
  }
</script>

<Popover.Root bind:open>
  <Popover.Trigger bind:ref={triggerRef}>
    {#snippet child({ props })}
      <Button
        {...props}
        variant="outline"
        class="w-full justify-between"
        role="combobox"
        aria-expanded={open}
      >
        <span class="truncate">
          {#if selectedLabel}
            {selectedLabel}
          {:else}
            <i class="opacity-50"> Search for a song </i>
          {/if}
        </span>
        <ChevronsUpDownIcon class="h-4 w-4 shrink-0 opacity-50" />
      </Button>
    {/snippet}
  </Popover.Trigger>

  <Popover.Content class="w-[400px] p-0">
    <Command.Root shouldFilter={false}>
      <Command.Input
        placeholder={m.songbook_searchAfterSong()}
        bind:value={searchQuery}
      />
      <Command.List>
        {#if isFetching}
          <div class="text-muted-foreground py-6 text-center text-sm">
            {m.songbook_searching()}
          </div>
        {:else if searchQuery.length < 2}
          <Command.Empty>{m.songbook_moreThatTwoChar()}</Command.Empty>
        {:else if searchResults.length === 0}
          <Command.Empty>{m.songbook_noSongsFound()}</Command.Empty>
        {:else if searchResults.length > 0}
          <Command.Group>
            {#each searchResults as song (song.id)}
              <Command.Item
                value={song.id}
                onSelect={() => {
                  songId = song.id;
                  title = song.title;
                  closeAndFocusTrigger();
                }}
              >
                <CheckIcon
                  class={cn(
                    "mr-2 h-4 w-4",
                    songId !== song.id && "text-transparent",
                  )}
                />
                {song.title}
              </Command.Item>
            {/each}
          </Command.Group>
        {/if}
      </Command.List>
    </Command.Root>
  </Popover.Content>
</Popover.Root>
