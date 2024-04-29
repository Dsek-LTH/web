<script lang="ts">
  import Price from "$lib/components/Price.svelte";
  import type { TicketWithMoreInfo } from "$lib/server/shop/getTickets";
  import TicketActions from "./TicketActions.svelte";
  import TicketEvent from "./TicketEvent.svelte";

  export let ticket: TicketWithMoreInfo;
</script>

<a
  href="/shop/tickets/{ticket.id}"
  class="group card card-compact overflow-hidden bg-base-300 shadow-xl"
>
  <TicketEvent event={ticket.event} />
  <div class="card-body">
    <div class="flex items-start justify-between">
      <span class="card-title">
        {ticket.title}
      </span>
      <div class="flex flex-col">
        <Price price={ticket.price} class="card-title" />
        {#if ticket.ticketsLeft < 10 && ticket.ticketsLeft > 0}
          <span class="text-right">
            {ticket.ticketsLeft} kvar
          </span>
        {/if}
      </div>
    </div>
    {#if ticket.description}
      <span>{ticket.description}</span>
    {/if}
    <TicketActions {ticket} />
  </div>
</a>
