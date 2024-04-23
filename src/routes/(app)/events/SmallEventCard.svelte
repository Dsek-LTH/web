<script lang="ts">
  import { relativeDate } from "$lib/utils/client/datetime.js";
  import InterestedGoingButtons from "./InterestedGoingButtons.svelte";
  import InterestedGoingList from "./InterestedGoingList.svelte";
  import MarkdownBody from "$lib/components/MarkdownBody.svelte";
  import type { InterestedGoingSchema } from "./interestedGoing";
  import type { EventWithIncludes } from "./events";
  import type { SuperValidated } from "sveltekit-superforms";

  export let event: EventWithIncludes;
  export let interestedGoingForm: SuperValidated<InterestedGoingSchema>;
</script>

<article
  class="row-span-2 grid grid-rows-subgrid gap-0 overflow-hidden rounded-xl bg-base-200"
>
  <div class="flex justify-between gap-4 bg-base-300 p-4">
    <div class="flex flex-wrap gap-2">
      {#each event.tags as tag}
        <span class="badge text-xs text-neutral-400">{tag.name}</span>
      {/each}
    </div>
  </div>

  <div class="flex flex-col p-8">
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
            <span class="font-semibold"
              >{relativeDate(event.startDatetime)}</span
            >
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
      <MarkdownBody
        body={event.description}
        class="line-clamp-4 text-ellipsis"
      />
    </div>
    <div class="my-3 flex flex-col items-start gap-0.5">
      <InterestedGoingList going={event.going} interested={event.interested} />
    </div>
  </div>
</article>
