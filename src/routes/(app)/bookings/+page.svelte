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
  import { BellRing, Info, KeyRound } from "@lucide/svelte";
  import Button from "$lib/components/ui/button/button.svelte";
  import { mode, setMode } from "mode-watcher";
  import StatusItem from "$lib/bookings/components/StatusItem.svelte";
  import Filter from "$lib/bookings/components/Filter.svelte";
  import InfoItem from "$lib/bookings/components/InfoItem.svelte";
  import type {
    CalendarApp,
    CalendarEventExternal,
  } from "@schedule-x/calendar";
  import { onMount, untrack } from "svelte";
  import { SvelteSet } from "svelte/reactivity";
  import { page } from "$app/state";
  import type { PageData } from "./$types";
  import * as m from "$paraglide/messages";

  let { data }: { data: PageData } = $props();

  let calendarApp: CalendarApp | undefined = $state();
  const eventsServicePlugin = createEventsServicePlugin();

  const bookings = $derived.by(() =>
    mapBookingsToCalendarEvents(data.bookings),
  );

  onMount(() => {
    sessionStorage.setItem("bookings", JSON.stringify(bookings));
  });

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
      if (!activeBookingIds.has(booking.id)) {
        eventsServicePlugin.add(booking);
        activeBookingIds.add(booking.id);
      }
    }
  });
</script>

<!-- TODO: Remove -->
<Button
  class="sx-calendar:block hidden"
  onclick={() => setMode(mode.current === "dark" ? "light" : "dark")}
  >SWITCH MODE/THEME</Button
>

<!-- TODO: Dynamically load older bookings when changing dates -->
<div
  class="sx-calendar:gap-6 sx-calendar:mt-10 mx-auto mt-6 mb-6 flex w-[var(--sx-calendar-width)] max-w-[var(--sx-calendar-max-width)] flex-col gap-5"
>
  <div class="flex w-full items-end justify-between">
    <div class="sx-calendar:gap-3 flex flex-col gap-2.5">
      <span
        class="text-foreground sx-calendar:text-6xl sx-calendar:-ml-1 sx-calendar:tracking-tighter -ml-0.5 text-5xl leading-none font-semibold tracking-tight uppercase"
      >
        Bookings
        <span class="text-primary italic">Dashboard</span>
      </span>
      <span
        class="text-muted-foreground sx-calendar:text-lg max-w-lg text-base leading-tight font-light"
      >
        Någon kort introducerande text om bokningar etc. etc. etc. etc. etc.
        etc. etc. etc. etc. etc. etc. etc. etc. etc. etc.
      </span>
    </div>

    <div class="sx-calendar:flex hidden gap-3.5">
      <StatusItem mode="desktop" variant="ACCEPTED" count={acceptedCount} />
      <StatusItem mode="desktop" variant="PENDING" count={pendingCount} />
      <StatusItem mode="desktop" variant="DENIED" count={deniedCount} />
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

  <div class="not-sx-calendar:flex-col flex w-full justify-between gap-4">
    <InfoItem
      Icon={Info}
      title="Viktig allmän info kanske?"
      description="hjskjfh akfhjkas hfjkah fjkhakfh ksafk ha afdjhasf kajkfh has fkhaksjf hf kahs fkjhajs"
    />
    <InfoItem
      Icon={KeyRound}
      title="Info om nycklar?"
      description="hjskjfh akfhjkas hfjkah fjkhakfh ksafk ha hakjfhkja fas jfhask fjkash fjkahf jkahf kjhakjf hakjf hajkfh kajhfs jkhfask"
    />
    <InfoItem
      Icon={BellRing}
      title="Info om svar på bokningar?"
      description="hjskjfh akfhjkas hfjkah fjkhakfh ksafk ha afag fhag"
    />
  </div>
</div>
