<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import * as HoverCard from "$lib/components/ui/hover-card";
  import Bell from "@lucide/svelte/icons/bell";
  import type { NotificationGroup } from "$lib/utils/notifications/group";
  import { getNotifications, readAllNotifications } from "./data.remote";
  import NotificationList from "./NotificationList.svelte";
  import { enhanceWithToast } from "$lib/stores/toast";

  const PAGE_SIZE = 20;

  const { unreadCountPromise }: { unreadCountPromise?: Promise<number> } =
    $props();

  let open = $state(false);

  let serverUnreadCount = $state(0);
  $effect(() => {
    if (!unreadCountPromise) {
      serverUnreadCount = 0;
      return;
    }
    unreadCountPromise.then((count) => {
      serverUnreadCount = count ?? 0;
    });
  });

  // Locally mark notifications as read to optimistically hide the badge
  let locallyMarkedRead = $state(false);
  let unreadCount = $derived(locallyMarkedRead ? 0 : serverUnreadCount);

  let notifications: NotificationGroup[] = $state([]);
  let hasMore = $state(false);
  let listLoaded = $state(false);
  let initialLoading = $state(false);
  let loadingMore = $state(false);
  let take = PAGE_SIZE;

  async function loadNotifications(newTake: number) {
    if (newTake === PAGE_SIZE) initialLoading = true;
    else loadingMore = true;
    try {
      const result = await getNotifications({ take: newTake });
      notifications = result.notifications;
      hasMore = result.hasMore;
      take = newTake;
      listLoaded = true;
    } finally {
      initialLoading = false;
      loadingMore = false;
    }
  }

  function loadMore() {
    void loadNotifications(take + PAGE_SIZE);
  }

  function handleDismissed(id: number) {
    notifications = notifications.filter((n) => n.id !== id);
  }

  function handleClearedAll() {
    notifications = [];
    hasMore = false;
  }

  let readForm: HTMLFormElement | null = $state(null);

  function markAllAsRead() {
    if (locallyMarkedRead) return;
    if (unreadCount === 0) return;
    locallyMarkedRead = true;
    readForm?.requestSubmit();
  }

  $effect(() => {
    if (!open) return;
    markAllAsRead();
    if (!listLoaded) void loadNotifications(take);
  });
</script>

<form
  {...enhanceWithToast(readAllNotifications)}
  bind:this={readForm}
  class="hidden"
  aria-hidden="true"
></form>

<HoverCard.Root bind:open openDelay={0} closeDelay={125}>
  <HoverCard.Trigger onclick={() => (open = !open)}>
    {#snippet child({ props })}
      <Button
        {...props}
        aria-label="notifications"
        size="icon-lg"
        variant="ghost"
        class="relative p-1.5"
      >
        <Bell />
        {#if unreadCount > 0}
          <span
            class="bg-rosa-400 text-primary-foreground absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] leading-none font-semibold"
            aria-label={`${unreadCount} unread notifications`}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        {/if}
      </Button>
    {/snippet}
  </HoverCard.Trigger>
  <HoverCard.Content
    class="z-150 flex w-[min(450px,calc(100vw-2rem))] flex-col p-0"
    align="end"
  >
    <NotificationList
      {notifications}
      {initialLoading}
      {loadingMore}
      {hasMore}
      listClass="max-h-[60vh]"
      onLoadMore={loadMore}
      onDismissed={handleDismissed}
      onClearedAll={handleClearedAll}
    />
  </HoverCard.Content>
</HoverCard.Root>
