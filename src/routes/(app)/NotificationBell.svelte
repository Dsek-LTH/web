<script lang="ts">
  import Notification from "$lib/components/Notification.svelte";
  import type { Notification as NotificationType } from "@prisma/client";
  // Enhance is used for actions without loading a page, similar to ajax
  import { invalidate } from "$app/navigation";
  import type { NotificationSchema } from "$lib/zod/schemas";
  import type { SuperValidated } from "sveltekit-superforms";
  import { superForm } from "sveltekit-superforms/client";

  export let notifications: NotificationType[];
  export let deleteForm: SuperValidated<NotificationSchema>;
  const { enhance } = superForm(deleteForm);

  // Get the number of unread notifications, which is then used to indicate the user
  $: unreadCount = notifications.filter((data) => data.readAt == null).length;

  const readNotifications = async () => {
    try {
      await fetch("/read-notifications", {
        method: "PUT",
      });
      await invalidate("/notifications");
    } catch (error) {
      console.error("Could not read notifications", error);
    }
  };
</script>

<div class="dropdown">
  <!-- When user clicks on the bell icon, it will update all notifications as read -->
  <button
    class="btn btn-ghost *:text-2xl"
    data-dropdown-toggle="dropdown"
    on:click={readNotifications}
  >
    {#if unreadCount <= 0}
      <span class="i-mdi-bell-outline" />
    {/if}
    {#if unreadCount > 0}
      <span class="i-mdi-bell-ring-outline animate-bounce" />
      <span
        class="absolute right-0 top-0 flex h-6 w-6 items-center justify-center rounded-box bg-red-600 text-center !text-sm"
        >{unreadCount}</span
      >
    {/if}
  </button>
  <ul
    class="menu dropdown-content !fixed right-0 w-full overflow-clip rounded-box bg-base-100 p-0 shadow sm:w-96"
  >
    {#if notifications.length >= 1}
      {#each notifications as notification (notification.id)}
        <li>
          <Notification {notification} {deleteForm} />
        </li>
      {/each}
      <!-- Deletes all notifications -->
      <form method="POST" action="/?/deleteNotification" use:enhance>
        <input
          type="hidden"
          name="notificationIds"
          value={notifications.map((a) => a.id)}
        />
        <button
          class="btn btn-ghost z-10 w-full rounded-none border-0 border-t border-gray-700 *:text-2xl"
        >
          Radera alla <span class="i-mdi-delete-outline" />
        </button>
      </form>
    {/if}
    {#if notifications.length < 1}
      <li class="after:bg-slate-100">
        <p>Ser rätt tomt ut här!</p>
      </li>
    {/if}
  </ul>
</div>
