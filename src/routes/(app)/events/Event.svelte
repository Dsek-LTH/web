<script lang="ts">
  import DateSpan from "./DateSpan.svelte";
  import MarkdownBody from "$lib/components/MarkdownBody.svelte";
  import type { Event } from "@prisma/client";
  import { getImageUrl } from "$lib/files/images";
  export let event: Pick<
    Event,
    | "title"
    | "startDatetime"
    | "endDatetime"
    | "shortDescription"
    | "description"
    | "imageUrl"
  >;
</script>

{#if event.imageUrl}
  <figure>
    <img class="mx-auto" src={getImageUrl(event.imageUrl)} alt={event.title} />
  </figure>
{/if}

<h1 class="text-2xl font-bold">
  {event.title}
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
