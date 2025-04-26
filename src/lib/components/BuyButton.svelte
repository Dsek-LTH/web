<script lang="ts">
  import { run } from "svelte/legacy";

  import { invalidate } from "$app/navigation";
  import { page } from "$app/state";
  import LoadingButton from "$lib/components/LoadingButton.svelte";
  import ScrollingNumber from "$lib/components/Timer/ScrollingNumber.svelte";
  import Timer from "$lib/components/Timer/Timer.svelte";
  import type { TicketWithMoreInfo } from "$lib/server/shop/getTickets";
  import { now } from "$lib/stores/date";
  import apiNames from "$lib/utils/apiNames";
  import { isAuthorized } from "$lib/utils/authorization";
  import * as m from "$paraglide/messages";
  import dayjs from "dayjs";
  import { twMerge } from "tailwind-merge";

  let cartPath = $derived(page.data["paths"]?.["cart"] ?? "/shop/cart");

  interface Props {
    /* If form that button is part of is currently submitting */
    isSubmitting: boolean;
    ticket: Pick<
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
    class?: string | undefined;
  }

  let { isSubmitting, ticket, class: clazz = undefined }: Props = $props();

  /* If ticket is available time-wise (not upcoming, not past)*/
  let isUpcoming = $derived(ticket.availableFrom > $now);
  let isCurrentlyAvailable = $derived(
    !isUpcoming && (!ticket.availableTo || ticket.availableTo > $now),
  );

  let isInGracePeriod = $derived(ticket.gracePeriodEndsAt > $now);

  run(() => {
    if (
      isCurrentlyAvailable &&
      ticket.isInUsersCart &&
      isInGracePeriod &&
      $now > ticket.gracePeriodEndsAt
    ) {
      invalidate("tickets");
    }
  });
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
{#if isAuthorized(apiNames.WEBSHOP.PURCHASE, page.data.user)}
  {#if isCurrentlyAvailable}
    {#if ticket.isInUsersCart}
      {#if isInGracePeriod}
        <span class={twMerge("text-xl", clazz)}>
          {m.tickets_buyButton_partOfLottery()}
          <Timer
            milliseconds={ticket.gracePeriodEndsAt.valueOf() - $now.valueOf()}
          />
        </span>
      {:else}
        <a type="button" href={cartPath} class="btn btn-primary">
          {#if ticket.userReservations.length > 0}
            {@const position = (ticket.userReservations[0]?.order ?? -100) + 1}
            {#if position >= 0}
              <span>
                {m.cart_reservation_queuePosition()}
                <ScrollingNumber number={position} />
              </span>
            {:else}
              {m.tickets_buyButton_inQueue()}
            {/if}
          {:else}
            {m.tickets_buyButton_inCart()}
          {/if}
        </a>
      {/if}
    {:else}
      <LoadingButton
        type="submit"
        disabled={isSubmitting ||
          ticket.userAlreadyHasMax ||
          ticket.ticketsLeft <= 0}
        class="btn btn-primary"
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        {#if ticket.ticketsLeft <= 0}
          {m.tickets_buyButton_soldOut()}
        {:else if ticket.userAlreadyHasMax}
          {m.tickets_buyButton_alreadyOwned()}
        {:else if ticket.hasQueue}
          {m.tickets_buyButton_enterQueue()}
        {:else if isInGracePeriod}
          {m.tickets_buyButton_getLotteryEntry()}
        {:else if ticket.price === 0}
          {m.tickets_buyButton_get()}
        {:else}
          {m.tickets_buyButton_purchase()}
        {/if}
      </LoadingButton>
    {/if}
  {:else if isUpcoming}
    {#if ticket.availableFrom.valueOf() - $now.valueOf() < 1000 * 60 * 5}
      <!-- Less than 5 minutes -->
      <span class={clazz}
        >{m.tickets_buyButton_releasesIn()}
        <Timer
          milliseconds={ticket.availableFrom.valueOf() - $now.valueOf()}
        /></span
      >
    {:else}
      <span class={clazz}>
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
