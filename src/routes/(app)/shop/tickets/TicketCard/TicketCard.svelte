<script context="module">
</script>

<script lang="ts">
  import type { SuperValidated } from "sveltekit-superforms";

  import type { AddToCartSchema } from "../+page.server";
  import type { TicketWithEvent } from "../types";
  import TicketActions from "./TicketActions.svelte";
  import TicketEvent from "./TicketEvent.svelte";

  export let ticket: TicketWithEvent;
  export let addToCartForm: SuperValidated<AddToCartSchema>;
</script>

<div class="group card card-compact overflow-hidden bg-base-300 shadow-xl">
  <TicketEvent event={ticket.event} />
  <div class="card-body">
    <div class="flex justify-between">
      <h2 class="card-title">{ticket.shoppable.title}</h2>
      <span class="card-title text-success"
        >{ticket.shoppable.price / 100} SEK</span
      >
    </div>
    <p>{ticket.shoppable.description}</p>
    <TicketActions {ticket} {addToCartForm} />
  </div>
</div>
