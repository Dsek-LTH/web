<script lang="ts">
  import dayjs from "dayjs";
  import AuthorCard from "./AuthorCard.svelte";
  import type { EventWithIncludes } from "$lib/events/getEvents";
  import TagChip from "./TagChip.svelte";
  import * as messages from "$paraglide/messages";

  let {
    event,
    index,
  }: {
    event: EventWithIncludes;
    index: number;
  } = $props();
</script>

<div
  class="hover:bg-muted-background animate-in fade-in fill-mode-backwards slide-in-from-bottom-[2rem] border-border flex flex-col rounded-xl border-[1px] p-4 duration-300"
  style="animation-delay:{index * 50}ms"
>
  <a href={"/events/" + event.slug}>
    {#if event.imageUrl}
      <div
        style="background-image: url({event.imageUrl});"
        class="aspect-[2/1] w-full shrink-0 rounded-md bg-[#eee] bg-cover bg-center"
      ></div>
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
    <AuthorCard
      member={event.author}
      customAuthor={null}
      position={undefined}
    />
    <span class="text-muted-foreground" class:line-through={event.isCancelled}
      >{dayjs(event.startDatetime).format("YYYY-MM-DD")}</span
    >
  </div>
</div>
