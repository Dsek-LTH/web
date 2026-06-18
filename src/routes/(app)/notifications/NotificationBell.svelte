<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import * as HoverCard from "$lib/components/ui/hover-card";
  import Bell from "@lucide/svelte/icons/bell";
  import type { NotificationGroup } from "$lib/utils/notifications/group";
  import { readAllNotifications } from "./data.remote";
  import NotificationList from "./NotificationList.svelte";
  import { enhanceWithToast } from "$lib/stores/toast";

  const {
    notificationsPromise,
  }: { notificationsPromise?: Promise<NotificationGroup[]> } = $props();

  let open = $state(false);

  // Locally mark notifications as read to optimistically hide the badge
  let locallyMarkedRead = $state(false);
  let resolvedNotifications: NotificationGroup[] = $state([]);
  let unreadCount = $derived(
    locallyMarkedRead
      ? 0
      : resolvedNotifications.filter((n) => n.readAt === null).length,
  );

  $effect(() => {
    if (!notificationsPromise) {
      resolvedNotifications = [];
      return;
    }
    notificationsPromise.then((list) => {
      resolvedNotifications = list ?? [];
    });
  });

  let readForm: HTMLFormElement | null = $state(null);

  function markAllAsRead() {
    if (locallyMarkedRead) return;
    if (unreadCount === 0) return;
    locallyMarkedRead = true;
    readForm?.requestSubmit();
  }

  $effect(() => {
    if (open) markAllAsRead();
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
    <NotificationList {notificationsPromise} listClass="max-h-[60vh]" />
  </HoverCard.Content>
</HoverCard.Root>
