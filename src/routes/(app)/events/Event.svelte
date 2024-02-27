<script lang="ts">
  import DateSpan from "./DateSpan.svelte";
  import MarkdownBody from "$lib/components/MarkdownBody.svelte";
  import type { Event } from "@prisma/client";

  export let event: Event;
</script>

<!-- {#if data.imageUrl}
  <figure>
    <img class="mx-auto" src={data.imageUrl} alt={data.header} />
  </figure>
{/if} -->

<h1 class="text-2xl font-bold">{event.title}</h1>

<section class="flex flex-row justify-between">
  <DateSpan start={event.startDatetime} end={event.endDatetime} />
  <slot name="actions" />
</section>
<div class="mt-3 flex flex-row gap-2 place-self-end">
  <div class="btn btn-outline btn-primary">
    <span class="i-mdi-check-circle-outline"></span>
    Kommer
  </div>
  <div class="btn btn-ghost btn-secondary">
    <span class="i-mdi-star-outline"></span>
    Intresserad
  </div>
</div>
<section class="my-2 flex flex-row items-center justify-between">
  <slot name="tags" />
</section>

<MarkdownBody
  body={event.shortDescription}
  class="mb-4 text-xl font-semibold !leading-snug"
/>
<MarkdownBody body={event.description} />

<slot name="after" />
