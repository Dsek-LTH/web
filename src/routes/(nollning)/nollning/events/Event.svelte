<script lang="ts">
  import { page } from "$app/stores";
  import MarkdownBody from "$lib/components/MarkdownBody.svelte";
  import type { TicketWithMoreInfo } from "$lib/server/shop/getTickets";
  import apiNames from "$lib/utils/apiNames";
  import { isAuthorized } from "$lib/utils/authorization";
  import type { Event } from "@prisma/client";
  import dayjs from "dayjs";
  import EventTicket from "./EventTicket.svelte";

  export let event: Event & {
    tickets: TicketWithMoreInfo[];
  };
</script>

<div
  class="collapse collapse-arrow rounded-btn border-2 border-base-200 bg-base-200 bg-transparent has-[input[type='radio']:checked]:border-base-content"
>
  <input type="radio" name="nolla-event-list" />
  <div class="collapse-title flex flex-col">
    <!-- Format date as Weekday HH:mm such as Monday 17.15 -->
    <span class="text-sm font-medium capitalize text-primary"
      >{dayjs(event.startDatetime).format("dddd HH:mm")}</span
    >
    <span class="text-base">{event.title}</span>
    <span class="text-sm font-medium text-neutral">{event.location}</span>
  </div>
  <div class="collapse-content flex flex-col">
    <p>
      <MarkdownBody body={event.description} class="leading-tight" />
    </p>
    <div class="mt-4 flex flex-col flex-wrap gap-4">
      {#if isAuthorized(apiNames.WEBSHOP.PURCHASE, $page.data.user)}
        <!-- TODO: Show more info about each ticket, now it's just a button -->
        {#each event.tickets as ticket, index (ticket.id)}
          <EventTicket {ticket} {index} />
        {/each}
      {/if}
    </div>
    {#if isAuthorized(apiNames.EVENT.UPDATE, $page.data.user)}
      <a href="/events/{event.slug}" class="btn btn-secondary mt-8 self-start">
        <span class="i-mdi-edit" />
      </a>
    {/if}
  </div>
</div>
