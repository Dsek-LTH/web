<script lang="ts">
  import dayjs from "dayjs";
  import type { EventWithIncludes } from "$lib/events/getEvents";
  import CommitteeSymbol from "./images/CommitteeSymbol.svelte";
  import CommitteePlaceholder from "./images/CommitteePlaceholder.svelte";
  import TagChip from "./TagChip.svelte";
  import * as m from "$paraglide/messages";
  import Users from "@lucide/svelte/icons/users";

  let {
    event,
    index,
  }: {
    event: EventWithIncludes;
    index: number;
  } = $props();

  let imageFailed = $state(false);
</script>

<div
  class="hover:bg-muted-background animate-in fade-in fill-mode-backwards slide-in-from-bottom-[2rem] border-border flex w-full flex-col rounded-xl border-[1px] p-4 duration-300"
  style="animation-delay:{index * 50}ms"
>
  <a href={"/events/" + event.slug}>
    {#if event.imageUrl}
      <div
        class="relative aspect-[2/1] w-full shrink-0 overflow-hidden rounded-md"
      >
        <div class="absolute inset-0" aria-hidden="true">
          <CommitteePlaceholder
            committee={event.committee ?? null}
            class="absolute inset-0"
          />
        </div>
        {#if !imageFailed}
          <img
            src={event.imageUrl}
            alt=""
            loading="lazy"
            class="absolute inset-0 size-full object-cover"
            onerror={() => (imageFailed = true)}
          />
        {/if}
      </div>
    {/if}

    <h3 class="mt-2 px-2" class:line-through={event.isCancelled}>
      {event.title}
    </h3>

    <div class="flex flex-row items-center gap-2 py-2 pl-2">
      {#each event.tags as tag (tag.id)}
        <TagChip {tag} />
      {/each}
    </div>

    <div
      class="prose-p:text-foreground line-clamp-2 px-2 overflow-ellipsis"
      class:line-through={event.isCancelled}
    >
      {event.description}
    </div></a
  >
  <div class="mt-auto flex flex-row items-center justify-between pt-2">
    {#if event.committee}
      <span
        class="flex min-w-0 flex-row items-center gap-2 pl-2 font-medium"
        title={m.events_organizer()}
      >
        <CommitteeSymbol committee={event.committee} size="sm" />
        <span class="truncate">{event.committee.name}</span>
      </span>
    {:else if event.organizer}
      <span
        class="flex min-w-0 flex-row items-center gap-2 pl-2 font-medium"
        title={m.events_organizer()}
      >
        <Users class="text-muted-foreground size-4 shrink-0" />
        <span class="truncate">{event.organizer}</span>
      </span>
    {/if}
    <span
      class="text-muted-foreground ml-auto pl-2"
      class:line-through={event.isCancelled}
    >
      {dayjs(event.startDatetime).format("YYYY-MM-DD")}
      {#if event.startDatetime.getDate() !== event.endDatetime.getDate()}
        <br />
        {dayjs(event.endDatetime).format("YYYY-MM-DD")}
      {/if}
    </span>
  </div>
</div>
