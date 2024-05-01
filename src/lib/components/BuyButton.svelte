<script lang="ts">
  import { goto, invalidate } from "$app/navigation";
  import { page } from "$app/stores";
  import Timer from "$lib/components/Timer/Timer.svelte";
  import type { TicketWithMoreInfo } from "$lib/server/shop/getTickets";
  import { now } from "$lib/stores/date";
  import apiNames from "$lib/utils/apiNames";
  import { isAuthorized } from "$lib/utils/authorization";
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
          Du har en lott. Dragning om <Timer
            milliseconds={ticket.gracePeriodEndsAt.valueOf() - $now.valueOf()}
          />
        </span>
      {:else}
        <div class="flex flex-col items-center gap-2">
          {#if ticket.userReservations.length > 0}
            <span>Står i kö</span>
          {:else}
            <span>Ligger i kundvagn</span>
          {/if}
          <button
            type="button"
            on:click|preventDefault={() => goto("/shop/cart")}
            class="btn btn-primary"
          >
            Gå till kundvagn
          </button>
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
          Slutsåld
        {:else if ticket.userAlreadyHasMax}
          Ägs redan
        {:else if ticket.hasQueue}
          {isSubmitting ? "Ställer dig i kö..." : "Ställ i kö"}
        {:else if isInGracePeriod}
          {isSubmitting ? "Skaffar lott..." : "Skaffa lott"}
        {:else if ticket.price === 0}
          {isSubmitting ? "Skaffar..." : "Skaffa"}
        {:else}
          {isSubmitting ? "Processerar..." : "Köp"}
        {/if}
      </button>
    {/if}
  {:else if isUpcoming}
    {#if ticket.availableFrom.valueOf() - $now.valueOf() < 1000 * 60 * 5}
      <!-- Less than 5 minutes -->
      <span class="text-2xl"
        >Släpps om <Timer
          milliseconds={ticket.availableFrom.valueOf() - $now.valueOf()}
        /></span
      >
    {:else}
      <span>
        Öppnar {dayjs(ticket.availableFrom).fromNow()}
        <!-- Stänger {dayjs(ticket.availableTo).fromNow()} -->
      </span>
    {/if}
  {/if}
{:else}
  <button type="button" disabled class="btn btn-disabled">
    Logga in för att köpa
  </button>
{/if}
