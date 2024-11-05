<script lang="ts">
  import DateSpan from "./DateSpan.svelte";
  import MarkdownBody from "$lib/components/MarkdownBody.svelte";
  import type { Event } from "@prisma/client";
  import { getFileUrl } from "$lib/files/client";
  export let event: Pick<
    Event,
    | "title"
    | "startDatetime"
    | "endDatetime"
    | "shortDescription"
    | "description"
    | "imageUrl"
  > &
    Partial<Pick<Event, "removedAt">>;
</script>

{#if event.imageUrl}
  <figure>
    <img class="mx-auto" src={getFileUrl(event.imageUrl)} alt={event.title} />
  </figure>
{/if}

<h1 class="text-2xl font-bold">
  {event.title}
  {#if event.removedAt}
    <span
      class="badge badge-error badge-sm relative -top-1 !text-xs font-semibold"
      >Raderat</span
    >
  {/if}
</h1>

<section class="flex flex-row justify-between">
  <DateSpan start={event.startDatetime} end={event.endDatetime} />
  <slot name="actions" />
</section>

<slot name="buttons" />

<section class="my-2 flex flex-row items-center justify-between">
  <slot name="tags" />
</section>

{#if event.shortDescription}
  <MarkdownBody
    body={event.shortDescription}
    class="mb-4 text-xl font-semibold !leading-snug"
  />
{/if}
<MarkdownBody body={event.description} />

<slot name="after" />
