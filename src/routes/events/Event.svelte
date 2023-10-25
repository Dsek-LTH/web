<script lang="ts">
  import MarkdownBody from "$lib/components/MarkdownBody.svelte";
  import { relativeDate } from "$lib/utils/datetime";
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
  <div class="text-primary">
    {#if Math.abs(event.startDatetime.valueOf() - event.endDatetime.valueOf()) < 24 * 60 * 60 * 1000}
      <span class="font-semibold">{relativeDate(event.startDatetime)}</span> <br />
      {event.startDatetime?.toLocaleTimeString(["sv"], {
        hour: "2-digit",
        minute: "2-digit",
      })} →
      {event.endDatetime?.toLocaleTimeString(["sv"], {
        hour: "2-digit",
        minute: "2-digit",
      })}
    {:else}
      <div class="flex flex-row items-center gap-4">
        <div>
          <span class="font-semibold">{relativeDate(event.startDatetime)}</span> <br />
          {event.startDatetime?.toLocaleTimeString(["sv"], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
        →
        <div>
          <span class="font-semibold">{relativeDate(event.endDatetime)}</span> <br />
          {event.endDatetime?.toLocaleTimeString(["sv"], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    {/if}
  </div>
  <slot name="actions" />
</section>
<section class="my-2 flex flex-row items-center justify-between">
  <slot name="tags" />
</section>

<MarkdownBody body={event.shortDescription} class="mb-4 text-xl font-semibold !leading-snug" />
<MarkdownBody body={event.description} />

<style>
</style>
