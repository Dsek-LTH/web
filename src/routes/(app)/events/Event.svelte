<script lang="ts">
  import DateSpan from "./DateSpan.svelte";
  import MarkdownBody from "$lib/components/MarkdownBody.svelte";
  import type { Event } from "@prisma/client";
  import InterestedGoingButtons from "./InterestedGoingButtons.svelte";

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
<InterestedGoingButtons />
<section class="my-2 flex flex-row items-center justify-between">
  <slot name="tags" />
</section>

<MarkdownBody
  body={event.shortDescription}
  class="mb-4 text-xl font-semibold !leading-snug"
/>
<MarkdownBody body={event.description} />

<slot name="after" />
