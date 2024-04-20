<script lang="ts">
  import { relativeDate } from "$lib/utils/client/datetime.js";
  import InterestedGoingButtons from "./InterestedGoingButtons.svelte";
  import InterestedGoingList from "./InterestedGoingList.svelte";
  import MarkdownBody from "$lib/components/MarkdownBody.svelte";
  import type { InterestedGoingSchema } from "./interestedGoing";
  import type { SuperForm } from "sveltekit-superforms/client";
  import type { Event } from "@prisma/client";

  export let event: Event;
  export let interestedGoingForm: SuperForm<InterestedGoingSchema>;
</script>

<article
  class="ease my-4 rounded-lg p-6 shadow-2xl ring-neutral-700 transition md:ring-1 md:hover:scale-[1.01]"
>
  <a href="/events/{event.slug}">
    <h2 class="text-2xl font-bold">{event.title}</h2>
  </a>

  <section class="text-primary">
    {#if Math.abs(event.startDatetime.valueOf() - event.endDatetime.valueOf()) < 24 * 60 * 60 * 1000}
      <span class="font-semibold">{relativeDate(event.startDatetime)}</span>
      <br />
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
          <span class="font-semibold">{relativeDate(event.startDatetime)}</span>
          <br />
          {event.startDatetime?.toLocaleTimeString(["sv"], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
        →
        <div>
          <span class="font-semibold">{relativeDate(event.endDatetime)}</span>
          <br />
          {event.endDatetime?.toLocaleTimeString(["sv"], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    {/if}
  </section>

  <InterestedGoingButtons
    eventId={event.id}
    {interestedGoingForm}
    going={event.going}
    interested={event.interested}
  />

  <div class="my-3 flex flex-col items-start gap-2">
    {#if event.shortDescription}
      <MarkdownBody
        body={event.shortDescription}
        class="mb-2 text-xl font-semibold !leading-snug"
      />
    {/if}
    <MarkdownBody body={event.description} class="line-clamp-4 text-ellipsis" />
  </div>

  <div class="flex flex-row flex-wrap gap-2">
    {#each event.tags as tag}
      <span class="badge text-xs text-neutral-400">{tag.name}</span>
    {/each}
  </div>
  <InterestedGoingList going={event.going} interested={event.interested} />
</article>
