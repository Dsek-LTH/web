<script lang="ts">
  import { invalidate } from "$app/navigation";
  import { page } from "$app/stores";
  import LiveTimeSince from "$lib/components/LiveTimeSince.svelte";
  import { i18n } from "$lib/utils/i18n";
  import type { NotificationSchema } from "$lib/zod/schemas";
  import type { Notification } from "@prisma/client";
  import type { SuperValidated } from "sveltekit-superforms";
  import { superForm } from "sveltekit-superforms/client";
  type NotificationItem = Pick<
    Notification,
    "link" | "title" | "message" | "createdAt" | "id" | "readAt"
  >;

  export let notification: NotificationItem;
  export let deleteForm: SuperValidated<NotificationSchema>;

  let readForm: HTMLFormElement;
  const readNotification = () => {
    // read notification
    readForm.requestSubmit();
    invalidate("/notifications");
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
  const { enhance } = superForm(deleteForm, {
    id: notification.id.toString() + "-delete",
  });
  const { enhance: readEnhance } = superForm(deleteForm, {
    id: notification.id.toString() + "-read",
  });
</script>

<div class="relative m-0 rounded-none">
  <form
    bind:this={readForm}
    method="POST"
    action="/notifications?/readNotifications"
    use:readEnhance
    class="hidden"
    aria-hidden="true"
  >
    <input type="hidden" name="notificationId" value={notification.id} />
  </form>
  <a
    href={notification.link}
    class="flex h-full w-80 max-w-80 flex-col justify-center {isUnread
      ? 'font-semibold'
      : 'opacity-80'}"
  >
    <span class="mt-1 w-11/12 truncate text-lg">{notification.title}</span>
    <span class="mb-1 w-11/12 truncate text-wrap text-xs"
      >{notification.message}</span
    >
    <span class="w-11/12 truncate text-wrap text-xs text-gray-500">
      <LiveTimeSince timeStamp={notification.createdAt.getTime()} />
    </span>
  </a>
  <!-- Deletes this notification -->
  <form method="POST" action="/notifications?/deleteNotification" use:enhance>
    <input type="hidden" name="notificationId" value={notification.id} />
    <button
      class="btn btn-ghost pointer-events-auto absolute right-0 top-0 z-10 h-full w-auto rounded-none p-2 *:text-2xl"
    >
      <span class="i-mdi-delete-outline"></span>
    </button>
  </form>
</div>
