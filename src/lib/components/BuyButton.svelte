<script lang="ts">
  import { invalidate } from "$app/navigation";
  import { page } from "$app/stores";
  import Timer from "$lib/components/Timer/Timer.svelte";
  import type { TicketWithMoreInfo } from "$lib/server/shop/getTickets";
  import { now } from "$lib/stores/date";
  import apiNames from "$lib/utils/apiNames";
  import { isAuthorized } from "$lib/utils/authorization";
  import * as m from "$paraglide/messages";
  import dayjs from "dayjs";
  /* If form that button is part of is currently submitting */
  export let isSubmitting: boolean;
  export let ticket: Pick<
    TicketWithMoreInfo,
    | "isInUsersCart"
    | "userAlreadyHasMax"
    | "ticketsLeft"
    | "availableFrom"
    | "availableTo"
    | "gracePeriodEndsAt"
    | "hasQueue"
    | "userItemsInCart"
    | "userReservations"
    | "price"
  >;
  $: cartPath = $page.data["paths"]?.["cart"] ?? "/shop/cart";

  /* If ticket is available time-wise (not upcoming, not past)*/
  $: isUpcoming = ticket.availableFrom > $now;
  $: isCurrentlyAvailable =
    !isUpcoming && (!ticket.availableTo || ticket.availableTo > $now);

  $: isInGracePeriod = ticket.gracePeriodEndsAt > $now;

  $: if (
    isCurrentlyAvailable &&
    ticket.isInUsersCart &&
    isInGracePeriod &&
    $now > ticket.gracePeriodEndsAt
  ) {
    invalidate("tickets");
  }
</script>

<!-- 
  States:
  - Upcoming -> Don't show
  - Past -> Don't show
  - Already in cart -> "Ligger i kundvagn"
  - Active
    - Sold out -> "Slutsåld" (disabled)
    - In grace period -> "Reservera" (another color)
    - Post-grace
      - Has queue -> "Ställ i kö" (anoher color)
      - Doesn't have queue -> "Köp" (active color)
 -->
{#if isAuthorized(apiNames.WEBSHOP.PURCHASE, $page.data.user)}
  {#if isCurrentlyAvailable}
    {#if ticket.isInUsersCart}
      {#if isInGracePeriod}
        <span class="text-xl">
          {m.tickets_buyButton_partOfLottery()}
          <Timer
            milliseconds={ticket.gracePeriodEndsAt.valueOf() - $now.valueOf()}
          />
        </span>
      {:else}
        <div class="flex flex-col items-center gap-2">
          {#if ticket.userReservations.length > 0}
            <span>{m.tickets_buyButton_inQueue()}</span>
          {:else}
            <span>{m.tickets_buyButton_inCart()}</span>
          {/if}
          <a type="button" href={cartPath} class="btn btn-primary">
            {m.tickets_buyButton_goToCart()}
          </a>
        </div>
      {/if}
    {:else}
      <button
        type="submit"
        disabled={isSubmitting ||
          ticket.userAlreadyHasMax ||
          ticket.ticketsLeft <= 0}
        class="btn btn-primary"
        on:click|stopPropagation
      >
        {#if ticket.ticketsLeft <= 0}
          {m.tickets_buyButton_soldOut()}
        {:else if ticket.userAlreadyHasMax}
          {m.tickets_buyButton_alreadyOwned()}
        {:else if ticket.hasQueue}
          {isSubmitting
            ? m.tickets_buyButton_enteringQueue()
            : m.tickets_buyButton_enterQueue()}
        {:else if isInGracePeriod}
          {isSubmitting
            ? m.tickets_buyButton_gettingLotteryEntry()
            : m.tickets_buyButton_getLotteryEntry()}
        {:else if ticket.price === 0}
          {isSubmitting
            ? m.tickets_buyButton_getting()
            : m.tickets_buyButton_get()}
        {:else}
          {isSubmitting
            ? m.tickets_buyButton_processing()
            : m.tickets_buyButton_purchase()}
        {/if}
      </button>
    {/if}
  {:else if isUpcoming}
    {#if ticket.availableFrom.valueOf() - $now.valueOf() < 1000 * 60 * 5}
      <!-- Less than 5 minutes -->
      <span class="text-2xl"
        >{m.tickets_buyButton_releasesIn()}
        <Timer
          milliseconds={ticket.availableFrom.valueOf() - $now.valueOf()}
        /></span
      >
    {:else}
      <span>
        {m.tickets_buyButton_opensIn()}
        {dayjs(ticket.availableFrom).fromNow()}
      </span>
    {/if}
  {/if}
{:else}
  <button type="button" disabled class="btn btn-disabled">
    {m.tickets_buyButton_logInToBuy()}
  </button>
{/if}
