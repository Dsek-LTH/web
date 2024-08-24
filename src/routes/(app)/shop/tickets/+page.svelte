<script lang="ts">
  import { page } from "$app/stores";
  import FoodPreferenceModal from "$lib/components/FoodPreferenceModal.svelte";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import { now } from "$lib/stores/date";
  import apiNames from "$lib/utils/apiNames";
  import { isAuthorized } from "$lib/utils/authorization";
  import * as m from "$paraglide/messages";
  import NavIcon from "$lib/components/NavIcon.svelte";
  import TicketSection from "./TicketSection.svelte";

  export let data;
  $: activeTickets = data.tickets.filter(
    (ticket) =>
      ticket.availableFrom <= $now &&
      (ticket.availableTo === null || ticket.availableTo >= $now),
  );
  $: upcomingTickets = data.tickets.filter(
    (ticket) => ticket.availableFrom > $now,
  );
  $: pastTickets = data.tickets.filter(
    (ticket) => ticket.availableTo && ticket.availableTo < $now,
  );
</script>

<SetPageTitle title={m.tickets()} />

<FoodPreferenceModal />

<article class="flex flex-col gap-4">
  {#if $page.data.isApp}
    <div class="flex gap-4 [&>*]:flex-1">
      <a class="btn" href="inventory">
        <NavIcon icon="i-mdi-treasure-chest" />

        {m.navbar_userMenu_inventory()}
        <!-- checks both not undefined and not 0 (since it's falsy) -->
        {#await data.shopItemCounts?.unconsumed then unconsumed}
          {#if unconsumed}
            <span class="badge badge-primary badge-sm">
              {unconsumed}
            </span>
          {/if}
        {/await}
      </a>
      {#await data.shopItemCounts?.inCart then inCart}
        {#if inCart}
          <a class="btn" href="cart">
            <NavIcon icon="i-mdi-cart" />
            {m.navbar_userMenu_cart()}
            <span class="badge badge-error badge-sm">
              {inCart}
            </span>
          </a>
        {/if}
      {/await}
    </div>
  {/if}
  {#if isAuthorized(apiNames.WEBSHOP.CREATE, data.user)}
    <a class="btn btn-secondary self-start" href="/shop/tickets/create"
      >{m.tickets_createNew()}</a
    >
  {/if}
  <TicketSection title={m.tickets_availableNow()} tickets={activeTickets} />
  <TicketSection title={m.tickets_upcoming()} tickets={upcomingTickets} />
  <TicketSection title={m.tickets_past()} tickets={pastTickets} />
</article>
