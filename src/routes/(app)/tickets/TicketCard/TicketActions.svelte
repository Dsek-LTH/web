<script lang="ts">
  import dayjs from "dayjs";

  import { now } from "$lib/stores/date";
  import type { SuperValidated } from "sveltekit-superforms";
  import { superForm } from "sveltekit-superforms/client";
  import type { AddToCartSchema, Ticket } from "../+page.server";

  export let ticket: Ticket;
  export let addToCartForm: SuperValidated<AddToCartSchema>;

  $: isUpcoming = ticket.availableFrom > $now;
  $: isPast = ticket.availableTo < $now;
  $: isActive = !isUpcoming && !isPast;

  const { enhance } = superForm(addToCartForm);
</script>

<div class="card-actions items-baseline justify-between">
  <span>
    {#if isUpcoming}
      Öppnar {dayjs(ticket.availableFrom).fromNow()}
    {:else if isPast}
      Stängde {dayjs(ticket.availableTo).fromNow()}
    {:else}
      Stänger {dayjs(ticket.availableTo).fromNow()}
    {/if}
  </span>
  <form method="POST" action="?/addToCart" use:enhance>
    <input type="hidden" name="ticket-id" value={ticket.id} />
    <button type="submit" disabled={!isActive} class="btn btn-primary">
      {#if isPast}
        Stängd
      {:else}
        Köp
      {/if}
    </button>
  </form>
</div>
