<script lang="ts">
  import { browser } from "$app/environment";
  import { enhance } from "$app/forms";
  import { invalidate } from "$app/navigation";
  import { page } from "$app/stores";
  import LiveTimeSince from "$lib/components/LiveTimeSince.svelte";
  import AuthorAvatars from "$lib/components/socials/AuthorAvatars.svelte";
  import { i18n } from "$lib/utils/i18n";
  import type { NotificationGroup } from "$lib/utils/notifications/group";

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

  export let notification: NotificationItem;
  export let allowDelete = true;
  export let onClick: (() => void) | undefined = undefined;
  export let onRead: (() => void) | undefined = undefined;

  let readForm: HTMLFormElement;
  const readNotification = () => {
    console.log("reading notification");
    // read notification
    readForm?.requestSubmit();
    onRead?.();
    if (browser) invalidate("/api/notifications/my");
  };

  // Handle "reading" notification when visiting relevant link
  $: isUnread = notification.readAt === null;
  $: isPathSame = i18n.route($page.url.pathname) === notification.link;
  $: (() => {
    if (isUnread && isPathSame) {
      setTimeout(() => {
        readNotification();
      });
    }
  })();

  $: authors = notification.authors.filter(Boolean) as Array<
    NonNullable<NotificationItem["authors"][number]>
  >;
</script>

<div class="relative flex w-full items-stretch rounded-none p-2">
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
    href={notification.link}
    on:click={onClick}
    class="flex max-w-full flex-1 items-center gap-4 overflow-hidden"
  >
    <div>
      <AuthorAvatars {authors} />
    </div>
    <div
      class="flex h-full flex-1 flex-col flex-nowrap items-stretch justify-center {isUnread
        ? 'font-medium'
        : 'opacity-80'}"
    >
      <span class="mt-1 line-clamp-1 text-base">{notification.title}</span>
      <span class="mb-1 line-clamp-2 text-ellipsis break-words text-xs"
        >{notification.message}</span
      >
      <span class="line-clamp-1 text-xs text-gray-500">
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
      <button class="btn btn-ghost -mr-2 rounded-none !px-2 *:text-2xl">
        <span class="i-mdi-delete-outline mx-0 opacity-50"></span>
      </button>
    </form>
  {/if}
</div>
