<script lang="ts">
  import { page } from "$app/state";
  import { Button } from "$lib/components/ui/button";
  import Search from "@lucide/svelte/icons/search";
  import CommandDialog from "$lib/components/search/CommandDialog.svelte";
  import NotificationBell from "./notifications/NotificationBell.svelte";

  const { unreadCountPromise }: { unreadCountPromise?: Promise<number> } =
    $props();

  let commandDialogOpen = $state(false);
</script>

<div class="flex w-full justify-center">
  <nav
    class="bg-muted-background border-rosa-background fixed top-0 z-500 mb-2 flex h-12 w-full flex-row items-center justify-between border-b-[1px] px-4 shadow-sm"
  >
    {#if page.data.member}
      <NotificationBell {unreadCountPromise} />
    {/if}
    <Button
      aria-label="search (Ctrl+K)"
      size="icon-lg"
      variant="ghost"
      class="ml-auto p-1.5"
      onclick={() => (commandDialogOpen = true)}><Search /></Button
    >
  </nav>
</div>

<CommandDialog bind:open={commandDialogOpen} />
