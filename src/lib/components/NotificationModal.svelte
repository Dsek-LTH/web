<script lang="ts">
  import { page } from "$app/stores";
  import Notification from "$lib/components/Notification.svelte";
  import type { NotificationGroup } from "$lib/utils/notifications/group";
  import type { NotificationSchema } from "$lib/zod/schemas";
  import * as m from "$paraglide/messages";
  import type { SuperValidated } from "sveltekit-superforms";

  export let modal: HTMLDialogElement;
  $: notifications = $page.data["notifications"] as NotificationGroup[] | null;
  $: mutateNotificationForm = $page.data[
    "mutateNotificationForm"
  ] as SuperValidated<NotificationSchema> | null;
  export let allowDelete = false;
</script>

<dialog id="notificationModal" class="modal" bind:this={modal}>
  <div
    class="modal-box flex h-[calc(100dvh-4rem)] w-[calc(100dvw-2rem)] flex-col flex-nowrap"
  >
    <form method="dialog">
      <button class="btn btn-circle btn-ghost btn-sm absolute right-2 top-2"
        >✕</button
      >
    </form>
    {#if notifications !== null}
      <ul class="menu -mx-6 flex-nowrap overflow-y-auto">
        {#each notifications as notification (notification.id)}
          <li>
            <Notification
              onClick={() => modal.close()}
              {allowDelete}
              {notification}
              form={mutateNotificationForm ?? undefined}
            />
          </li>
        {/each}
      </ul>
    {:else}
      <li class="p-4">{m.navbar_bell_noNotifications()}</li>
    {/if}
  </div>
  <form method="dialog" class="modal-backdrop">
    <button>close</button>
  </form>
</dialog>
