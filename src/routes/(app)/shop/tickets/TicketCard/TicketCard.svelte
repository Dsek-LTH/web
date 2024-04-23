<script lang="ts">
  import type { TicketWithMoreInfo } from "$lib/server/shop/getTickets";
  import type { SuperValidated } from "sveltekit-superforms";
  import type { AddToCartSchema } from "../+page.server";
  import TicketActions from "./TicketActions.svelte";
  import TicketEvent from "./TicketEvent.svelte";
  import Price from "$lib/components/Price.svelte";

  export let ticket: TicketWithMoreInfo;
  export let addToCartForm: SuperValidated<AddToCartSchema>;
</script>

<a
  href="/shop/tickets/{ticket.id}"
  class="group card card-compact overflow-hidden bg-base-300 shadow-xl"
>
  <TicketEvent event={ticket.event} />
  <div class="card-body">
    <div class="flex items-start justify-between">
      <h2 class="card-title">
        {ticket.title}
      </h2>
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
      <p>{ticket.description}</p>
    {/if}
    <TicketActions {ticket} {addToCartForm} />
  </div>
</a>
