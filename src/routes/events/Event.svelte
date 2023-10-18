<script lang="ts">
  import TagChip from "$lib/components/TagChip.svelte";
  import { marked } from "marked";
  import type { Event } from "./events";
  import { relativeDate } from "$lib/datetime";

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
  <div class="flex flex-row flex-wrap gap-2">
    {#each event.tags as tag}
      <TagChip {tag} />
    {/each}
  </div>
</section>

<article class="prose-a prose lg:prose-xl prose-a:text-primary prose-a:no-underline">
  <span class=" block text-xl font-semibold">{event.shortDescription}</span>
  <!-- The article body is sanitized server-side. -->
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html marked(event.description)}
</article>

<style>
</style>
