<script lang="ts">
  import type { SuperValidated } from "sveltekit-superforms";
  import type { AddToCartSchema } from "./+page.server";
  import TicketCard from "./TicketCard/TicketCard.svelte";
  import type { TicketWithEvent } from "./types";

  export let title: string;
  export let tickets: TicketWithEvent[];
  export let addToCartForm: SuperValidated<AddToCartSchema>;
</script>

<section>
  <h3 class="mb-2 text-xl font-semibold">{title}</h3>
  <ul class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
    {#each tickets as ticket (ticket.id)}
      <TicketCard {ticket} {addToCartForm} />
    {/each}
  </ul>
</section>
