<script lang="ts">
  import { relativeDate } from "$lib/utils/client/datetime";
  import InterestedGoingButtons from "./InterestedGoingButtons.svelte";
  import InterestedGoingList from "./InterestedGoingList.svelte";
  import MarkdownBody from "$lib/components/MarkdownBody.svelte";
  import type { InterestedGoingSchema } from "$lib/events/schema";
  import type { EventWithIncludes } from "$lib/events/getEvents";
  import type { SuperValidated } from "sveltekit-superforms";
  import { eventLink } from "$lib/utils/redirect";
  import { languageTag } from "$paraglide/runtime";

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
    <a href={eventLink(event)}>
      <h2 class="text-2xl font-bold">
        {event.title}
        {#if event.removedAt !== null}
          <span
            class="badge badge-error badge-sm relative -top-1 !text-xs font-semibold"
            >Raderat</span
          >
        {/if}
      </h2>
    </a>

    <section class="text-primary">
      {#if Math.abs(event.startDatetime.valueOf() - event.endDatetime.valueOf()) < 24 * 60 * 60 * 1000}
        <span class="font-semibold">{relativeDate(event.startDatetime)}</span>
        <br />
        {event.startDatetime?.toLocaleTimeString([languageTag()], {
          hour: "2-digit",
          minute: "2-digit",
        })} →
        {event.endDatetime?.toLocaleTimeString([languageTag()], {
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
            {event.startDatetime?.toLocaleTimeString([languageTag()], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
          →
          <div>
            <span class="font-semibold">{relativeDate(event.endDatetime)}</span>
            <br />
            {event.endDatetime?.toLocaleTimeString([languageTag()], {
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
