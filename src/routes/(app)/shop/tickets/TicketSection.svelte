<script lang="ts">
  import type { TicketWithMoreInfo } from "$lib/server/shop/getTickets";
  import TicketCard from "./TicketCard/TicketCard.svelte";

  interface Props {
    title: string;
    tickets: TicketWithMoreInfo[];
  }

  let { title, tickets }: Props = $props();
</script>

{#if tickets.length > 0}
  <section>
    <h3 class="mb-2 text-xl font-semibold">{title}</h3>
    <ul
      class="grid grid-cols-1 items-stretch gap-2 sm:grid-cols-2 lg:grid-cols-3"
    >
      {#each tickets as ticket (ticket.id)}
        <TicketCard {ticket} />
      {/each}
    </ul>
  </section>
{/if}
