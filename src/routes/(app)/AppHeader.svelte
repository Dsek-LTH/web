<script lang="ts">
  import { page } from "$app/state";
  import { Button } from "$lib/components/ui/button";
  import Search from "@lucide/svelte/icons/search";
  import CommandDialog from "$lib/components/search/CommandDialog.svelte";
  import NotificationBell from "./notifications/NotificationBell.svelte";
  import { onMount } from "svelte";

  const { unreadCountPromise }: { unreadCountPromise?: Promise<number> } =
    $props();

  let commandDialogOpen = $state(false);

  // IOS creates insets that has the height of the notch, making it safe to place content below it
  // Android places its insets inside of the already safe space, therefore we ignore it
  let heightInset = $derived(
    page.data.appInfo?.os == "ios" ? page.data.appInfo?.insets?.top : 0,
  );
</script>

<div class="flex w-full justify-center">
  <nav
    style:padding-top={heightInset + "px"}
    style:height={(heightInset ?? 0) + 12 * 4 + "px"}
    class="bg-muted-background border-rosa-background fixed top-0 z-500 mb-2 flex w-full flex-row items-center justify-between border-b-[1px] px-4 shadow-sm"
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
