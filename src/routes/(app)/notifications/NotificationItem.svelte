<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import MemberAvatars from "$lib/components/member/MemberAvatars.svelte";
  import { Trash } from "@lucide/svelte";
  import dayjs from "dayjs";
  import type { NotificationGroup } from "$lib/utils/notifications/group";
  import { deleteNotification } from "./data.remote";
  import { enhanceWithToast, type RemoteForm } from "$lib/stores/toast";

  const { notification }: { notification: NotificationGroup } = $props();
</script>

<div
  class="hover:bg-accent flex w-full flex-row items-center justify-between rounded-md p-2"
>
  <a href={notification.link} class="flex flex-row items-center">
    <div class="w-12">
      <MemberAvatars
        members={notification.authors
          .filter((author) => author?.member)
          .map((author) => author!.member)}
      />
    </div>
    <div class="flex flex-col pl-2">
      <span class="font-semibold">{notification.title}</span>
      <span class="text-sm">{notification.message}</span>
      <span class="text-xs font-light">
        {dayjs(notification.createdAt).format("YYYY-MM-DD")}
      </span>
    </div>
  </a>
  <form
    {...enhanceWithToast(
      deleteNotification.for(notification.id) as unknown as RemoteForm,
    )}
  >
    {#if notification.individualIds.length > 1}
      <input
        type="hidden"
        name="notificationIds"
        value={notification.individualIds.join(",")}
      />
    {:else}
      <input type="hidden" name="notificationId" value={notification.id} />
    {/if}
    <Button
      aria-label="dismiss notification"
      size="icon"
      variant="ghost"
      class="text-muted-foreground ml-2 size-10 shrink-0"
      type="submit"><Trash class="size-4" /></Button
    >
  </form>
</div>
