<script lang="ts">
  import { now } from "$lib/stores/date";
  import apiNames from "$lib/utils/apiNames";
  import { isAuthorized } from "$lib/utils/authorization";
  import FoodPreferenceModal from "$lib/components/FoodPreferenceModal.svelte";
  import TicketSection from "./TicketSection.svelte";
  import * as m from "$paraglide/messages";

  export let data;
  $: activeTickets = data.tickets.filter(
    (ticket) =>
      ticket.availableFrom <= $now &&
      (ticket.availableTo === null || ticket.availableTo >= $now),
  );
  $: upcomingTickets = data.tickets.filter(
    (ticket) => ticket.availableFrom > $now,
  );
  $: pastTickets = data.tickets.filter(
    (ticket) => ticket.availableTo && ticket.availableTo < $now,
  );
</script>

<svelte:head>
  <title>{m.tickets()} | D-sektionen</title>
</svelte:head>

<FoodPreferenceModal />

<article class="flex flex-col gap-4">
  {#if isAuthorized(apiNames.WEBSHOP.CREATE, data.user)}
    <a class="btn btn-secondary self-start" href="/shop/tickets/create"
      >{m.tickets_createNew()}</a
    >
  {/if}
  <TicketSection title={m.tickets_availableNow()} tickets={activeTickets} />
  <TicketSection title={m.tickets_upcoming()} tickets={upcomingTickets} />
  <TicketSection title={m.tickets_past()} tickets={pastTickets} />
</article>
