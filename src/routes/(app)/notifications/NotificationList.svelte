<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import Spinner from "$lib/components/ui/spinner/spinner.svelte";
  import { Trash } from "@lucide/svelte";
  import * as m from "$paraglide/messages";
  import type { NotificationGroup } from "$lib/utils/notifications/group";
  import { deleteAllNotifications } from "./data.remote";
  import NotificationItem from "./NotificationItem.svelte";
  import { enhanceWithToast } from "$lib/stores/toast";

  const {
    notifications,
    initialLoading = false,
    loadingMore = false,
    hasMore = false,
    listClass = "max-h-[60vh]",
    onLoadMore,
    onDismissed,
    onClearedAll,
  }: {
    notifications: NotificationGroup[];
    initialLoading?: boolean;
    loadingMore?: boolean;
    hasMore?: boolean;
    listClass?: string;
    onLoadMore?: () => void;
    onDismissed?: (id: number) => void;
    onClearedAll?: () => void;
  } = $props();
</script>

{#if initialLoading}
  <div class="p-4"><Spinner /></div>
{:else}
  <div class="flex flex-col gap-2 overflow-y-auto p-2 {listClass}">
    {#each notifications as notification (notification.id)}
      <NotificationItem {notification} {onDismissed} />
    {/each}
    {#if notifications.length === 0}
      <p class="text-muted-foreground py-4 text-center text-sm">
        {m.navbar_bell_noNotifications()}
      </p>
    {:else if hasMore}
      <Button
        aria-label={m.navbar_bell_loadMore()}
        variant="ghost"
        class="text-muted-foreground w-full"
        disabled={loadingMore}
        onclick={onLoadMore}
      >
        {#if loadingMore}
          <Spinner class="size-4" />
        {:else}
          {m.navbar_bell_loadMore()}
        {/if}
      </Button>
    {/if}
  </div>
  <div class="border-t p-2">
    <form
      {...enhanceWithToast(deleteAllNotifications, async (helpers) => {
        if (await helpers.submit()) onClearedAll?.();
      })}
    >
      <Button
        aria-label={m.navbar_bell_deleteAll()}
        variant="ghost"
        class="text-muted-foreground w-full"
        type="submit"
        disabled={notifications.length === 0}
        ><Trash class="size-4" />
        {m.navbar_bell_deleteAll()}</Button
      >
    </form>
  </div>
{/if}
