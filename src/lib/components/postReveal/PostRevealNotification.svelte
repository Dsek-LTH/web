<script lang="ts">
  import { run } from "svelte/legacy";

  import { browser } from "$app/environment";
  import { enhance } from "$app/forms";
  import { invalidate } from "$app/navigation";
  import { page } from "$app/stores";
  import LiveTimeSince from "$lib/components/LiveTimeSince.svelte";
  import {
    OVERRIDEN_POST_REVEAL_ROUTES,
    POST_REVEAL_PREFIX,
  } from "$lib/components/postReveal/types";
  import AuthorAvatars from "$lib/components/socials/AuthorAvatars.svelte";
  import { i18n } from "$lib/utils/i18n";
  import type { NotificationGroup } from "$lib/utils/notifications/group";

  const overrideLink = (link: string) => {
    const routeIndex = OVERRIDEN_POST_REVEAL_ROUTES.findIndex((route) =>
      link.startsWith(route.from),
    );
    if (routeIndex === -1) return link;
    return (
      OVERRIDEN_POST_REVEAL_ROUTES[routeIndex]!.to ??
      `${POST_REVEAL_PREFIX}${OVERRIDEN_POST_REVEAL_ROUTES[routeIndex]?.from}`
    );
  };
  type NotificationItem = Pick<
    NotificationGroup,
    | "link"
    | "title"
    | "message"
    | "createdAt"
    | "id"
    | "individualIds"
    | "readAt"
    | "authors"
  >;

  interface Props {
    notification: NotificationItem;
    allowDelete?: boolean;
    onClick?: (() => void) | undefined;
    onRead?: (() => void) | undefined;
  }

  let {
    notification,
    allowDelete = true,
    onClick = undefined,
    onRead = undefined,
  }: Props = $props();

  let link = $derived(overrideLink(notification.link));

  let readForm: HTMLFormElement = $state();
  const readNotification = () => {
    // read notification
    onRead?.();
    readForm?.requestSubmit();
    if (browser) invalidate("/api/notifications/my");
  };

  // Handle "reading" notification when visiting relevant link
  let isUnread = $derived(notification.readAt === null);
  let isPathSame = $derived(
    i18n.route($page.url.pathname) === link ||
      (link.startsWith("/news/") &&
        i18n
          .route($page.url.pathname)
          .startsWith(`${POST_REVEAL_PREFIX}/messages`)),
  );
  run(() => {
    (() => {
      if (isUnread && isPathSame) {
        setTimeout(() => {
          readNotification();
        });
      }
    })();
  });

  let authors = $derived(
    notification.authors.filter(Boolean) as Array<
      NonNullable<NotificationItem["authors"][number]>
    >,
  );
</script>

<div
  class="relative flex w-full items-stretch rounded-none p-2"
  class:bg-base-200={isUnread}
>
  <form
    bind:this={readForm}
    method="POST"
    action="/notifications?/readNotifications"
    use:enhance
    class="hidden"
    aria-hidden="true"
  >
    {#if notification.individualIds.length > 1}
      {#each notification.individualIds as id}
        <input type="hidden" name="notificationIds" value={id} />
      {/each}
    {:else}
      <input type="hidden" name="notificationId" value={notification.id} />
    {/if}
  </form>

  <a
    href={link}
    onclick={onClick}
    class="flex max-w-full flex-1 items-center gap-4 overflow-hidden"
  >
    <div>
      <AuthorAvatars {authors} />
    </div>
    <div
      class="flex h-full flex-1 flex-col flex-nowrap items-stretch justify-center"
    >
      <span class="mt-1 line-clamp-1 text-base">{notification.title}</span>
      <span
        class="mb-1 line-clamp-2 text-ellipsis break-words text-xs text-neutral"
        >{notification.message}</span
      >
      <span class="line-clamp-1 text-xs text-base-300">
        <LiveTimeSince timeStamp={notification.createdAt.getTime()} />
      </span>
    </div>
  </a>
  {#if allowDelete}
    <!-- Deletes this notification -->
    <form
      class="flex items-stretch"
      method="POST"
      action="/notifications?/deleteNotification"
      use:enhance
    >
      {#if notification.individualIds.length > 1}
        {#each notification.individualIds as id}
          <input type="hidden" name="notificationIds" value={id} />
        {/each}
      {:else}
        <input type="hidden" name="notificationId" value={notification.id} />
      {/if}
      <!-- svelte-ignore a11y_consider_explicit_label -->
      <button class="btn btn-ghost -mr-2 rounded-none !px-2 *:text-2xl">
        <span class="i-mdi-delete-outline mx-0 opacity-50"></span>
      </button>
    </form>
  {/if}
</div>
