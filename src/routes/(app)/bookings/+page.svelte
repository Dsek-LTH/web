<script lang="ts">
  import BookingsCalendar from "$lib/bookings/calendar/BookingsCalendar.svelte";
  import {
    filterBookingEvents,
    getBookingStatusCount,
    mapBookingsToCalendarEvents,
  } from "$lib/bookings/mappers";
  import {
    getCategoryFilterValue,
    isMineFilterActive,
  } from "$lib/bookings/filters";
  import { createEventsServicePlugin } from "@schedule-x/events-service";
  import { ListChecksIcon, Plus, SettingsIcon } from "@lucide/svelte";
  import Button from "$lib/components/ui/button/button.svelte";
  import StatusItem from "$lib/bookings/components/StatusItem.svelte";
  import Filter from "$lib/bookings/components/Filter.svelte";
  import type {
    CalendarApp,
    CalendarEventExternal,
  } from "@schedule-x/calendar";
  import { onDestroy, onMount, untrack } from "svelte";
  import { clearOptimisticStatusOverrides } from "$lib/bookings/calendar/components/modal/EventModal.svelte";
  import { SvelteSet } from "svelte/reactivity";
  import { page } from "$app/state";
  import type { PageData } from "./$types";
  import * as m from "$paraglide/messages";
  import apiNames from "$lib/utils/apiNames";
  import { isAuthorized } from "$lib/utils/authorization";

  let { data }: { data: PageData } = $props();

  const isAdmin = $derived(
    isAuthorized(apiNames.BOOKINGS.UPDATE, page.data.user),
  );

  const reviewQueueCount = $derived(
    data.bookings.filter(
      ({ status, end }) =>
        status === "PENDING" && !!end && new Date(end) >= new Date(),
    ).length,
  );

  let calendarApp: CalendarApp | undefined = $state();
  const eventsServicePlugin = createEventsServicePlugin();

  const bookings = $derived.by(() =>
    mapBookingsToCalendarEvents(data.bookings),
  );

  onMount(() => {
    sessionStorage.setItem("bookings", JSON.stringify(bookings));
  });
  onDestroy(clearOptimisticStatusOverrides);

  const defaultCategory = {
    value: "all categories",
    label: m.booking_allCategories(),
  };

  const activeBookingIds = new SvelteSet<CalendarEventExternal["id"]>();
  const currentStudentId = $derived(page.data.user?.studentId ?? null);
  const currentCategoryValue = $derived(
    getCategoryFilterValue(page.url.searchParams, defaultCategory.value),
  );
  const filteredBookings = $derived.by(() => {
    return filterBookingEvents(bookings, {
      categoryValue: currentCategoryValue,
      defaultCategoryValue: defaultCategory.value,
      mineOnly: isMineFilterActive(page.url.searchParams),
      currentStudentId,
    });
  });

  const acceptedCount = $derived(
    getBookingStatusCount(filteredBookings, "ACCEPTED"),
  );
  const pendingCount = $derived(
    getBookingStatusCount(filteredBookings, "PENDING"),
  );
  const deniedCount = $derived(
    getBookingStatusCount(filteredBookings, "DENIED"),
  );

  $effect(() => {
    if (!untrack(() => calendarApp)) return;

    if (activeBookingIds.size === 0) {
      const existingEvents = eventsServicePlugin.getAll();
      existingEvents.forEach((event) => activeBookingIds.add(event.id));
    }

    const nextVisibleIds = new Set(
      filteredBookings.map((booking) => booking.id),
    );

    for (const id of activeBookingIds) {
      if (!nextVisibleIds.has(id)) {
        eventsServicePlugin.remove(id);
        activeBookingIds.delete(id);
      }
    }

    for (const booking of filteredBookings) {
      if (activeBookingIds.has(booking.id)) {
        // Push the latest data (e.g. status/colour after accept/reject)
        // into an already-tracked event, since add() only applies to new ones.
        eventsServicePlugin.update(booking);
      } else {
        eventsServicePlugin.add(booking);
        activeBookingIds.add(booking.id);
      }
    }
  });
</script>

<!-- TODO: Dynamically load older bookings when changing dates -->
<div
  class="sx-calendar:gap-6 sx-calendar:mt-10 mx-auto mt-6 mb-6 flex w-[var(--sx-calendar-width)] max-w-[var(--sx-calendar-max-width)] flex-col gap-5"
>
  <div
    class="sx-calendar:flex-row sx-calendar:items-end sx-calendar:justify-between flex w-full flex-col gap-4 pb-2"
  >
    <div class="flex flex-col gap-1">
      <h1 class="-ml-0.5">
        {m.booking_title()}
      </h1>
      <span class="text-muted-foreground max-w-lg text-base">
        {m.booking_subtitle()}
      </span>
    </div>

    <!-- MOBILE -->
    <div class="sx-calendar:hidden flex flex-col gap-2">
      <Button size="lg" class="h-12 w-full" href="/bookings/create">
        <Plus class="size-4" />
        <span class="font-semibold uppercase">{m.booking_newBooking()}</span>
      </Button>
      {#if isAdmin}
        <div class="flex gap-2 *:flex-1">
          {#if reviewQueueCount > 0}
            <Button variant="outline" href="/bookings/admin/review">
              <ListChecksIcon class="size-4" />
              {m.booking_reviewPending({ count: reviewQueueCount })}
            </Button>
          {/if}
          <Button variant="outline" href="/bookings/admin">
            <SettingsIcon class="size-4" />
            {m.booking_manageBookings()}
          </Button>
        </div>
      {/if}
    </div>

    <div class="sx-calendar:flex hidden flex-col items-end gap-3">
      {#if isAdmin}
        <div class="flex gap-2">
          {#if reviewQueueCount > 0}
            <Button variant="outline" size="sm" href="/bookings/admin/review">
              <ListChecksIcon class="size-4" />
              {m.booking_reviewPending({ count: reviewQueueCount })}
            </Button>
          {/if}
          <Button variant="outline" size="sm" href="/bookings/admin">
            <SettingsIcon class="size-4" />
            {m.booking_manageBookings()}
          </Button>
        </div>
      {/if}

      <div class="flex gap-3.5">
        <StatusItem mode="desktop" variant="ACCEPTED" count={acceptedCount} />
        <StatusItem mode="desktop" variant="PENDING" count={pendingCount} />
        <StatusItem mode="desktop" variant="DENIED" count={deniedCount} />
      </div>
    </div>
  </div>

  <Filter {bookings} {defaultCategory} {currentCategoryValue} />

  <div class="sx-calendar:hidden flex justify-between gap-3">
    <StatusItem mode="mobile" variant="ACCEPTED" count={acceptedCount} />
    <StatusItem mode="mobile" variant="PENDING" count={pendingCount} />
    <StatusItem mode="mobile" variant="DENIED" count={deniedCount} />
  </div>

  <BookingsCalendar
    bind:calendarApp
    plugins={[eventsServicePlugin]}
    {bookings}
  />
</div>
