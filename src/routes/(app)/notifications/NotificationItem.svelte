<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import * as Avatar from "$lib/components/ui/avatar";
  import { Trash } from "@lucide/svelte";
  import dayjs from "dayjs";
  import type { components } from "$lib/api/schema";
  import { deleteNotification } from "./data.remote";
  import { enhanceWithToast } from "$lib/stores/toast";

  type NotificationGroup = components["schemas"]["Group"];

  const { notification }: { notification: NotificationGroup } = $props();

  const authors = $derived(notification.authors ?? []);
  const individualIds = $derived(notification.individualIds ?? []);

  // NotificationAuthor only carries a pre-resolved display name (it can be
  // "Ordförande Jane Doe" or a bare nickname, not always "First Last"), so
  // initials come from the first letter of up to the first two
  // whitespace-separated words, not firstName/lastName the way
  // getInitials() (for full Member objects) does.
  function initialsFromName(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "NN";
    if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
    return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase();
  }
</script>

<div
  class="hover:bg-accent flex w-full flex-row items-center justify-between rounded-md p-2"
>
  <a href={notification.link} class="flex flex-row items-center">
    <div class="w-12">
      {#if authors.length === 1}
        <Avatar.Root class="size-10">
          <Avatar.Image src={authors[0]!.pictureUrl} alt={authors[0]!.name} />
          <Avatar.Fallback class="text-xs">
            {initialsFromName(authors[0]!.name)}
          </Avatar.Fallback>
        </Avatar.Root>
      {:else}
        <div class="ml-6 flex w-fit flex-row">
          {#each authors.slice(0, 3) as author (author.id)}
            <div class="-ml-6">
              <Avatar.Root class="size-10">
                <Avatar.Image src={author.pictureUrl} alt={author.name} />
                <Avatar.Fallback class="text-xs">
                  {initialsFromName(author.name)}
                </Avatar.Fallback>
              </Avatar.Root>
            </div>
          {/each}
        </div>
      {/if}
    </div>
    <div class="flex flex-col pl-2">
      <span class="font-semibold">{notification.title}</span>
      <span class="text-sm">{notification.message}</span>
      <span class="text-xs font-light">
        {dayjs(notification.createdAt).format("YYYY-MM-DD")}
      </span>
    </div>
  </a>
  <form {...enhanceWithToast(deleteNotification.for(notification.id))}>
    {#if individualIds.length > 1}
      <input
        type="hidden"
        name="notificationIds"
        value={individualIds.join(",")}
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
