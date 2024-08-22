<script lang="ts">
  import { invalidate } from "$app/navigation";
  import { page } from "$app/stores";
  import LiveTimeSince from "$lib/components/LiveTimeSince.svelte";
  import AuthorAvatars from "$lib/components/socials/AuthorAvatars.svelte";
  import { i18n } from "$lib/utils/i18n";
  import type { NotificationGroup } from "$lib/utils/notifications/group";
  import type { NotificationSchema } from "$lib/zod/schemas";
  import type { SuperValidated } from "sveltekit-superforms";
  import { superForm } from "$lib/utils/client/superForms";
  import { browser } from "$app/environment";
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
  export let form: SuperValidated<NotificationSchema> | undefined = undefined;
  export let allowDelete = true;
  export let onClick: (() => void) | undefined = undefined;

  let readForm: HTMLFormElement;
  const readNotification = () => {
    // read notification
    readForm?.requestSubmit();
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

  // can be used for reading as well, same types
  $: superformDelete =
    form && allowDelete
      ? superForm(form, {
          id: notification.id.toString() + "-delete",
        })
      : undefined;
  $: enhanceDelete = superformDelete?.enhance;
  $: superformRead = form
    ? superForm(form, {
        id: notification.id.toString() + "-read",
      })
    : undefined;
  $: enhanceRead = superformRead?.enhance;

  $: authors = notification.authors.filter(Boolean) as Array<
    NonNullable<NotificationItem["authors"][number]>
  >;
</script>

<div class="relative m-0 rounded-none">
  {#if superformRead && enhanceRead}
    <form
      bind:this={readForm}
      method="POST"
      action="/notifications?/readNotifications"
      use:enhanceRead
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
  {/if}
  <div>
    <AuthorAvatars {authors} />
  </div>
  <a
    href={notification.link}
    class="flex h-full flex-col flex-nowrap justify-center {isUnread
      ? 'font-semibold'
      : 'opacity-80'}"
    on:click={onClick}
  >
    <span class="mt-1 w-11/12 truncate text-lg">{notification.title}</span>
    <span class="mb-1 w-11/12 truncate text-wrap text-xs"
      >{notification.message}</span
    >
    <span class="w-11/12 truncate text-wrap text-xs text-gray-500">
      <LiveTimeSince timeStamp={notification.createdAt.getTime()} />
    </span>
  </a>
  {#if superformDelete && enhanceDelete}
    <!-- Deletes this notification -->
    <form
      method="POST"
      action="/notifications?/deleteNotification"
      use:enhanceDelete
    >
      {#if notification.individualIds.length > 1}
        {#each notification.individualIds as id}
          <input type="hidden" name="notificationIds" value={id} />
        {/each}
      {:else}
        <input type="hidden" name="notificationId" value={notification.id} />
      {/if}
      <button
        class="btn btn-ghost pointer-events-auto absolute right-0 top-0 z-10 h-full w-auto rounded-none p-2 *:text-2xl"
      >
        <span class="i-mdi-delete-outline"></span>
      </button>
    </form>
  {/if}
</div>
