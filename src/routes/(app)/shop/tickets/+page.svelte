<script lang="ts">
  import { now } from "$lib/stores/date";
  import apiNames from "$lib/utils/apiNames";
  import { isAuthorized } from "$lib/utils/authorization";
  import TicketSection from "./TicketSection.svelte";

  export let data;
  $: activeTickets = data.tickets.filter(
    (ticket) =>
      ticket.availableFrom <= $now &&
      (ticket.availableTo === null ||
        ticket.availableTo >= $now),
  );
  $: upcomingTickets = data.tickets.filter(
    (ticket) => ticket.availableFrom > $now,
  );
  $: pastTickets = data.tickets.filter(
    (ticket) =>
      ticket.availableTo && ticket.availableTo < $now,
  );
</script>

<svelte:head>
  <title>Biljetter | D-sektionen</title>
</svelte:head>

<article class="flex flex-col gap-4">
  {#if isAuthorized(apiNames.WEBSHOP.CREATE, data.user)}
    <a class="btn btn-secondary self-start" href="/shop/tickets/create"
      >Skapa ny biljett</a
    >
  {/if}
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
