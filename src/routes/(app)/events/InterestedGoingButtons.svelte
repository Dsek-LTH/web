<script lang="ts">
  import { page } from "$app/stores";
  import type { SuperValidated } from "sveltekit-superforms";
  import type { InterestedGoingSchema } from "$lib/events/schema";
  import { superForm } from "$lib/utils/client/superForms";
  import type { Member } from "@prisma/client";
  import * as m from "$paraglide/messages";

  interface Props {
    eventId: string;
    interested: Member[];
    going: Member[];
    interestedGoingForm: SuperValidated<InterestedGoingSchema>;
  }

  let { eventId, interested, going, interestedGoingForm }: Props = $props();
  const { constraints, enhance } = superForm(interestedGoingForm, {
    id: eventId, // needs to be unique since there could be multiple like buttons on a page
  });

  let authorized = $derived(Boolean($page.data.user));
  let isGoing = $state(
    going.some((member) => member.studentId === $page.data.user?.studentId),
  );
  let isGoingIcon = $derived(
    isGoing ? "i-mdi-check-circle bg-primary" : "i-mdi-check-circle-outline",
  );

  let isInterested = $state(
    interested.some(
      (member) => member.studentId === $page.data.user?.studentId,
    ),
  );
  let isInterestedIcon = $derived(
    isInterested ? "i-mdi-star bg-yellow-500" : "i-mdi-star-outline",
  );
</script>

{#if $page.data.member}
  <div class="bg-yell my-3 flex flex-row gap-2">
    <form
      method="POST"
      action="/events?/{isInterested
        ? 'interested'
        : isGoing
          ? 'going'
          : 'none'}"
      use:enhance
    >
      <input type="hidden" value={eventId} name="eventId" {...$constraints} />
      <button
        disabled={!authorized}
        type="submit"
        class="btn btn-ghost"
        onclick={() => {
          isGoing = !isGoing;
          isInterested = false;
        }}
      >
        <span class={isGoingIcon + " size-6"}></span>
        {m.events_interestedGoing_going()}
      </button>
      <button
        disabled={!authorized}
        type="submit"
        class="btn btn-ghost"
        onclick={() => {
          isInterested = !isInterested;
          isGoing = false;
        }}
      >
        <span class={isInterestedIcon + " size-6"}></span>
        {m.events_interestedGoing_interested()}
      </button>
    </form>
  </div>
{/if}
