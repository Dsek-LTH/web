<script lang="ts">
  import type { SuperValidated } from "sveltekit-superforms";
  import type { AddToCartSchema } from "../+page.server";
  import type { TicketWithEvent } from "../types";
  import TicketActions from "./TicketActions.svelte";
  import TicketEvent from "./TicketEvent.svelte";

  export let ticket: TicketWithEvent;
  export let addToCartForm: SuperValidated<AddToCartSchema>;
</script>

<a href="/shop/tickets/{ticket.id}">
  <div class="group card card-compact overflow-hidden bg-base-300 shadow-xl">
    <TicketEvent event={ticket.event} />
    <div class="card-body">
      <div class="flex items-start justify-between">
        <h2 class="card-title">
          {ticket.shoppable.title}
        </h2>
        <div class="flex flex-col">
          <span class="card-title text-success">
            {ticket.shoppable.price / 100} SEK
          </span>
          <span class="text-right">
            {ticket.stock - ticket.shoppable._count.consumables} kvar
          </span>
        </div>
      </div>
      <p>{ticket.shoppable.description}</p>
      <TicketActions {ticket} {addToCartForm} />
    </div>
  </div>
</a>
