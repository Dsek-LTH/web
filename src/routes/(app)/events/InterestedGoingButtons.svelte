<script lang="ts">
  import { enhance } from "$app/forms";
  import { page } from "$app/state";
  import { Button } from "$lib/components/ui/button";
  import type { ExtendedPrismaModel } from "$lib/server/extendedPrisma";
  import * as m from "$paraglide/messages";

  import CircleCheck from "@lucide/svelte/icons/circle-check";
  import Star from "@lucide/svelte/icons/star";

  let {
    eventId,
    interested,
    going,
  }: {
    eventId: string;
    interested: Array<Pick<ExtendedPrismaModel<"Member">, "studentId">>;
    going: Array<Pick<ExtendedPrismaModel<"Member">, "studentId">>;
  } = $props();

  const studentId = $derived(page.data.user?.studentId);
  const isGoing = $derived(
    going.some((member) => member.studentId === studentId),
  );
  const isInterested = $derived(
    interested.some((member) => member.studentId === studentId),
  );
</script>

{#if page.data.member}
  <div class="flex flex-row gap-2">
    <!-- Each button posts the state it should toggle *to*, so the action never
         depends on optimistic client state. -->
    <form method="POST" action={isGoing ? "?/none" : "?/going"} use:enhance>
      <input type="hidden" name="eventId" value={eventId} />
      <Button
        type="submit"
        variant={isGoing ? "rosa" : "outline"}
        aria-pressed={isGoing}
      >
        <CircleCheck />
        {m.events_interestedGoing_going()}
      </Button>
    </form>
    <form
      method="POST"
      action={isInterested ? "?/none" : "?/interested"}
      use:enhance
    >
      <input type="hidden" name="eventId" value={eventId} />
      <Button
        type="submit"
        variant={isInterested ? "rosa" : "outline"}
        aria-pressed={isInterested}
      >
        <Star />
        {m.events_interestedGoing_interested()}
      </Button>
    </form>
  </div>
{/if}
