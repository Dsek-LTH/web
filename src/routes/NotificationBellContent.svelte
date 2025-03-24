<script lang="ts">
  import Notification from "$lib/components/Notification.svelte";
  import PostRevealNotification from "$lib/components/postReveal/PostRevealNotification.svelte";
  import { superForm } from "$lib/utils/client/superForms";
  import type { NotificationGroup } from "$lib/utils/notifications/group";
  import type { NotificationSchema } from "$lib/zod/schemas";
  import * as m from "$paraglide/messages";
  import { flip } from "svelte/animate";
  import type { SuperValidated } from "sveltekit-superforms";

  export let form: SuperValidated<NotificationSchema>;
  export let notifications: NotificationGroup[];
  export let postReveal = false;
  export let onDeleted: () => void;
  export let onRead: (id: number | "all") => void;

  const { enhance: deleteEnhance } = superForm(form, {
    onUpdate: onDeleted,
    id: "deleteNotification",
  });

  const { enhance: readEnhance } = superForm(form, {
    id: "readNotifications",
    onSubmit: () => {
      onRead("all");
    },
  });
</script>

{#if notifications.length > 0}
  <div class="overflow-y-auto">
    {#each notifications as notification (notification.id)}
      <li animate:flip={{ duration: 200 }}>
        {#if postReveal}
          <PostRevealNotification {notification} />
        {:else}
          <Notification {notification} onRead={() => onRead(notification.id)} />
        {/if}
      </li>
    {/each}
  </div>
  <!-- Read all notifications (notifications are read on visit otherwise) -->
  {#if notifications?.filter((n) => n.readAt === null)?.length > 0}
    <form
      method="POST"
      action="/notifications?/readNotifications"
      use:readEnhance
      data-sveltekit-keepfocus
    >
      {#each notifications as notification (notification.id)}
        {#if notification.readAt === null}
          {#each notification.individualIds as id}
            <input type="hidden" name="notificationIds" value={id} />
          {/each}
        {/if}
      {/each}
      <button
        class="btn btn-ghost no-animation z-10 w-full rounded-none border-0 border-t border-gray-700 *:text-2xl"
      >
        {m.navbar_bell_markAllAsRead()}
        <span class="i-mdi-bell-check-outline" />
      </button>
    </form>
  {/if}
  <!-- Deletes all notifications -->
  {#if notifications?.flatMap((n) => n.individualIds).length > 0}
    <form
      method="POST"
      action="/notifications?/deleteNotification"
      use:deleteEnhance
      data-sveltekit-keepfocus
    >
      {#each notifications as notification (notification.id)}
        {#each notification.individualIds as id}
          <input type="hidden" name="notificationIds" value={id} />
        {/each}
      {/each}
      <button
        class="btn btn-ghost no-animation z-10 w-full rounded-none border-0 border-t border-gray-700 *:text-2xl"
      >
        {m.navbar_bell_deleteAll()}
        <span class="i-mdi-delete-outline" />
      </button>
    </form>
  {/if}
{:else}
  <li class="p-4">
    {m.navbar_bell_noNotifications()}
  </li>
{/if}
