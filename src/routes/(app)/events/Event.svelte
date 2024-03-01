<script lang="ts">
  import DateSpan from "./DateSpan.svelte";
  import MarkdownBody from "$lib/components/MarkdownBody.svelte";
  import type { Event } from "@prisma/client";
  import InterestedGoingButtons from "./InterestedGoingButtons.svelte";
  import InterestedGoingList from "./InterestedGoingList.svelte";
  import type { PageData } from "./$types";
  export let data: PageData;

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
<InterestedGoingButtons
  eventId={event.id}
  interestedGoingForm={data.interestedGoingForm}
  interested={event.interested}
  going={event.going}
/>

<InterestedGoingList going={event.going} interested={event.interested} />

<section class="my-2 flex flex-row items-center justify-between">
  <slot name="tags" />
</section>

<MarkdownBody
  body={event.shortDescription}
  class="mb-4 text-xl font-semibold !leading-snug"
/>
<MarkdownBody body={event.description} />

<slot name="after" />
