<script lang="ts">
  import dayjs from "dayjs";

  import { now } from "$lib/stores/date";
  import type { SuperValidated } from "sveltekit-superforms";
  import { superForm } from "sveltekit-superforms/client";
  import type { AddToCartSchema } from "../+page.server";
  import type { TicketWithEvent } from "../types";

  export let ticket: TicketWithEvent;
  export let addToCartForm: SuperValidated<AddToCartSchema>;

  $: isUpcoming = ticket.shoppable.availableFrom > $now;
  $: isPast =
    ticket.shoppable.availableTo && ticket.shoppable.availableTo < $now;
  $: isActive = !isUpcoming && !isPast;

  const { enhance, submitting } = superForm(addToCartForm);
</script>

<div class="card-actions items-baseline justify-between">
  <span>
    {#if isUpcoming}
      Öppnar relativeTime(ticket.shoppable.availableFrom) Öppnar {dayjs(
        ticket.shoppable.availableFrom,
      ).fromNow()}
    {:else if isPast}
      Stängde {dayjs(ticket.shoppable.availableTo).fromNow()}
    {:else}
      Stänger {dayjs(ticket.shoppable.availableTo).fromNow()}
    {/if}
  </span>
  <form method="POST" action="?/addToCart" use:enhance>
    <input type="hidden" name="ticket-id" value={ticket.id} />
    <button
      type="submit"
      disabled={!isActive || $submitting}
      class="btn btn-primary"
    >
      {#if isPast}
        Stängd
      {:else}
        {$submitting ? "Processar..." : "Köp"}
      {/if}
    </button>
  </form>
</div>
