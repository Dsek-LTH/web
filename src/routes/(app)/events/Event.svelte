<script lang="ts">
  import DateSpan from "./DateSpan.svelte";
  import MarkdownBody from "$lib/components/MarkdownBody.svelte";
  export let event: {
    title: string;
    startDatetime: Date;
    endDatetime: Date;
    shortDescription: string | null;
    description: string;
  };
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
