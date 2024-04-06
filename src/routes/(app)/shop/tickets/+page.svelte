<script lang="ts">
  import { now } from "$lib/stores/date";
  import TicketSection from "./TicketSection.svelte";

  export let data;
  $: activeTickets = data.tickets.filter(
    (ticket) =>
      ticket.shoppable.availableFrom <= $now &&
      (ticket.shoppable.availableTo === null ||
        ticket.shoppable.availableTo >= $now),
  );
  $: upcomingTickets = data.tickets.filter(
    (ticket) => ticket.shoppable.availableFrom > $now,
  );
  $: pastTickets = data.tickets.filter(
    (ticket) =>
      ticket.shoppable.availableTo && ticket.shoppable.availableTo < $now,
  );
</script>

<svelte:head>
  <title>Biljetter | D-sektionen</title>
</svelte:head>

<article class="flex flex-col gap-4">
  <TicketSection
    title="Biljetter som kan köpas nu"
    tickets={activeTickets}
    addToCartForm={data.addToCartForm}
  />
  <TicketSection
    title="Kommande biljetter"
    tickets={upcomingTickets}
    addToCartForm={data.addToCartForm}
  />
  <TicketSection
    title="Tidigare biljetter"
    tickets={pastTickets}
    addToCartForm={data.addToCartForm}
  />
</article>
