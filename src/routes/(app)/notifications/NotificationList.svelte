<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import Spinner from "$lib/components/ui/spinner/spinner.svelte";
  import { Trash } from "@lucide/svelte";
  import * as m from "$paraglide/messages";
  import type { NotificationGroup } from "$lib/utils/notifications/group";
  import { deleteAllNotifications } from "./data.remote";
  import NotificationItem from "./NotificationItem.svelte";
  import { enhanceWithToast, type RemoteForm } from "$lib/stores/toast";

  const {
    notificationsPromise,
    listClass = "max-h-[60vh]",
  }: {
    notificationsPromise?: Promise<NotificationGroup[]>;
    listClass?: string;
  } = $props();
</script>

{#await notificationsPromise}
  <div class="p-4"><Spinner /></div>
{:then notifications}
  {@const list = notifications ?? []}
  <div class="flex flex-col gap-2 overflow-y-auto p-2 {listClass}">
    {#each list as notification (notification.id)}
      <NotificationItem {notification} />
    {/each}
    {#if list.length === 0}
      <p class="text-muted-foreground py-4 text-center text-sm">
        {m.navbar_bell_noNotifications()}
      </p>
    {/if}
  </div>
  <div class="border-t p-2">
    <form
      {...enhanceWithToast(deleteAllNotifications as unknown as RemoteForm)}
    >
      <Button
        aria-label={m.navbar_bell_deleteAll()}
        variant="ghost"
        class="text-muted-foreground w-full"
        type="submit"
        disabled={list.length === 0}
        ><Trash class="size-4" />
        {m.navbar_bell_deleteAll()}</Button
      >
    </form>
  </div>
{/await}
