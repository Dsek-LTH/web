<script lang="ts">
  import { page } from "$app/stores";
  import Notification from "$lib/components/Notification.svelte";
  import * as m from "$paraglide/messages";
  // eslint-disable-next-line no-restricted-imports -- It's a top level layout so I would say this is fine
  import type { GlobalAppLoadData } from "../../routes/(app)/+layout.server";

  export let modal: HTMLDialogElement;
  $: pageData = $page.data as typeof $page.data & GlobalAppLoadData;
  $: notifications = pageData["notifications"];
  $: mutateNotificationForm = pageData["mutateNotificationForm"];
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
      {#await notifications}
        <span class="loading loading-lg" />
      {:then notifications}
        {#if notifications.length > 0}
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
      {/await}
    {:else}
      <li class="p-4">{m.navbar_bell_noNotifications()}</li>
    {/if}
  </div>
  <form method="dialog" class="modal-backdrop">
    <button>close</button>
  </form>
</dialog>
