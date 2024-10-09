<script lang="ts">
  import PageHeader from "$lib/components/nav/PageHeader.svelte";
  import * as m from "$paraglide/messages";
  import dayjs from "dayjs";

  export let data;
  $: tickets = data.tickets;
</script>

<PageHeader title={m.tickets()} />

<article class="flex flex-col gap-4">
  <ul class="menu">
    {#each tickets as ticket}
      <li>
        <a href="/shop/tickets/{ticket.id}/manage">
          {ticket.title}, {ticket.event.title} ({dayjs(
            ticket.event.startDatetime,
          ).format("DD-MM-YYYY")})
        </a>
      </li>
    {/each}
  </ul>
</article>
