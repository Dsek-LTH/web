<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import * as Popover from "$lib/components/ui/popover";
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

  // Hover-to-open on devices with a fine pointer (desktop), click on touch.
  let hoverTimeout: ReturnType<typeof setTimeout> | null = null;
  const HOVER_OPEN_DELAY = 100;
  const HOVER_CLOSE_DELAY = 150;

  function canHover() {
    return (
      typeof window !== "undefined" &&
      window.matchMedia?.("(hover: hover) and (pointer: fine)").matches
    );
  }

  function scheduleOpen(value: boolean) {
    if (!canHover()) return;
    if (hoverTimeout) clearTimeout(hoverTimeout);
    hoverTimeout = setTimeout(
      () => (open = value),
      value ? HOVER_OPEN_DELAY : HOVER_CLOSE_DELAY,
    );
  }

  function handleMouseEnter() {
    scheduleOpen(true);
  }
  function handleMouseLeave() {
    scheduleOpen(false);
  }
</script>

<form
  {...enhanceWithToast(readAllNotifications)}
  bind:this={readForm}
  class="hidden"
  aria-hidden="true"
></form>

<div
  onmouseenter={handleMouseEnter}
  onmouseleave={handleMouseLeave}
  role="presentation"
>
  <Popover.Root bind:open>
    <Popover.Trigger>
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
    </Popover.Trigger>
    <Popover.Content
      class="z-150 flex w-[min(450px,calc(100vw-2rem))] flex-col p-0"
      align="end"
      onmouseenter={handleMouseEnter}
      onmouseleave={handleMouseLeave}
      onOpenAutoFocus={(e) => {
        // Don't steal focus when opened via hover
        if (canHover()) e.preventDefault();
      }}
    >
      <NotificationList {notificationsPromise} listClass="max-h-[60vh]" />
    </Popover.Content>
  </Popover.Root>
</div>
