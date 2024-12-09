<script lang="ts">
  import Notification from "$lib/components/Notification.svelte";
  import PostRevealNotification from "$lib/components/postReveal/PostRevealNotification.svelte";
  import type { NotificationGroup } from "$lib/utils/notifications/group";
  import * as m from "$paraglide/messages";

  export let modal: HTMLDialogElement;
  export let notifications: NotificationGroup[] | undefined = undefined;
  export let allowDelete = true;
  export let postReveal = false;
  export let onRead = (id: number | "all") => {
    console.log("onRead");
    if (id === "all") {
      notifications = notifications?.map((notification) => ({
        ...notification,
        readAt: new Date(),
      }));
    } else {
      notifications = notifications?.map((notification) =>
        notification.id === id
          ? {
              ...notification,
              readAt: new Date(),
            }
          : notification,
      );
    }
    notifications = notifications;
    console.log(notifications?.filter((n) => !n.readAt).length);
  };
</script>

<dialog id="notificationModal" class="modal" bind:this={modal}>
  <div
    class="modal-box relative flex h-[calc(100dvh-8rem)] w-[calc(100dvw-2rem)] flex-col flex-nowrap"
  >
    {#if notifications !== undefined}
      <ul class="-mx-6 flex-nowrap overflow-y-auto">
        {#if notifications.length > 0}
          {#each notifications as notification (notification.id)}
            <li>
              {#if postReveal}
                <PostRevealNotification
                  onClick={() => modal.close()}
                  {allowDelete}
                  {notification}
                  onRead={() => onRead(notification.id)}
                />
              {:else}
                <Notification
                  onClick={() => modal.close()}
                  {allowDelete}
                  {notification}
                  onRead={() => onRead(notification.id)}
                />
              {/if}
            </li>
          {/each}
        {:else}
          <li class="p-4">{m.navbar_bell_noNotifications()}</li>
        {/if}
      </ul>
    {:else}
      <span class="loading loading-lg mx-auto self-center" />
    {/if}
    <form method="dialog">
      <button
        class="btn btn-circle btn-ghost btn-sm absolute right-2 top-2 z-10 bg-base-100"
        >✕</button
      >
    </form>
  </div>
  <form method="dialog" class="modal-backdrop">
    <button>close</button>
  </form>
</dialog>
