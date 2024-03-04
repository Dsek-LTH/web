<script lang="ts">
  import LiveTimeSince from "$lib/components/LiveTimeSince.svelte";
  import type { NotificationSchema } from "$lib/zod/schemas";
  import type { Notification } from "@prisma/client";
  import type { SuperValidated } from "sveltekit-superforms";
  import { superForm } from "sveltekit-superforms/client";
  type NotificationItem = Pick<
    Notification,
    "link" | "title" | "message" | "createdAt" | "id"
  >;

  export let notification: NotificationItem;
  export let deleteForm: SuperValidated<NotificationSchema>;

  const { enhance } = superForm(deleteForm, {
    id: notification.id.toString(),
  });
</script>

<div class="relative m-0 rounded-none">
  <a
    href={notification.link}
    class="flex h-full w-80 max-w-80 flex-col justify-center"
  >
    <span class="my-1 w-11/12 truncate text-lg font-bold"
      >{notification.title}</span
    >
    <span class="w-11/12 truncate text-wrap text-xs"
      >{notification.message}</span
    >
    <span class="w-11/12 truncate text-wrap text-xs text-gray-500">
      <LiveTimeSince timeStamp={notification.createdAt.getTime()} />
    </span>
  </a>
  <!-- Deletes this notification -->
  <form method="POST" action="/?/deleteNotification" use:enhance>
    <input type="hidden" name="notificationId" value={notification.id} />
    <button
      class="btn btn-ghost pointer-events-auto absolute right-0 top-0 z-10 h-full w-auto rounded-none p-2 *:text-2xl"
    >
      <span class="i-mdi-delete-outline"></span>
    </button>
  </form>
</div>
