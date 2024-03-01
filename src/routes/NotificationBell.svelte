<script lang="ts">
  import Notification from "$lib/components/Notification.svelte";
  // Enhance is used for actions without loading a page, similar to ajax
  import { enhance } from "$app/forms";
  import { page } from "$app/stores";

  export let notifications: {
    id: number;
    title: string;
    message: string;
    type: string;
    link: string;
    readAt: Date | null;
    memberId: string;
    createdAt: Date;
    updatedAt: Date;
    fromAuthorId: string | null;
  }[];

  // Get the number of unread notifications, which is then used to indicate the user
  let unread: number = 0;
  notifications.forEach((data) => {
    if (data.readAt == null) {
      unread += 1;
    }
  });

  // This deletes the notification on the client as well
  const removeNotification = (id: number) => {
    notifications = notifications.filter((data, index) => data.id != id);
  };
</script>

<div class="dropdown">
  <!-- When user clicks on the bell icon, it will update all notifications as read -->
  <form
    action="/?/readnotifications"
    method="POST"
    use:enhance={() => {
      return ({ result, update }) => {
        unread = 0;
      };
    }}
  >
    <input type="hidden" name="memberId" value={$page.data.user?.memberId} />
    <button class="btn btn-ghost *:text-2xl" data-dropdown-toggle="dropdown">
      {#if unread <= 0}
        <span class="i-mdi-bell-outline" />
      {/if}
      {#if unread > 0}
        <span class="i-mdi-bell-ring-outline animate-bounce" />
        <span
          class="absolute right-0 top-0 flex h-6 w-6 items-center justify-center rounded-box bg-red-600 text-center !text-sm"
          >{unread}</span
        >
      {/if}
    </button>
  </form>
  <ul
    class="menu dropdown-content !fixed right-0 w-full overflow-clip rounded-box bg-base-100 p-0 shadow sm:w-96"
  >
    {#if notifications.length >= 1}
      {#each notifications as notification (notification.id)}
        <li>
          <Notification
            removeFunc={removeNotification}
            {notification}
            memberId={$page.data.user?.memberId}
          />
        </li>
      {/each}
      <!-- Deletes all notifications -->
      <form
        method="POST"
        action="/?/deletenotification"
        use:enhance={() => {
          return ({ result, update }) => {
            notifications = [];
          };
        }}
      >
        <input
          type="hidden"
          name="memberId"
          value={$page.data.user?.memberId}
        />
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
