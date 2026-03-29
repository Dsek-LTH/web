<script lang="ts">
  import BookingsCalendar from "./calendar/BookingsCalendar.svelte";
  import { createBookingEvent } from "$lib/bookings/createBookingEvent";
  import type { BookingCalendarEvent } from "$lib/bookings/eventTypes";
  import { createEventsServicePlugin } from "@schedule-x/events-service";
  import { BellRing, Info, KeyRound } from "@lucide/svelte";
  import Button from "$lib/components/ui/button/button.svelte";
  import { mode, setMode } from "mode-watcher";
  import StatusItem from "./components/StatusItem.svelte";
  import Filter from "./components/Filter.svelte";
  import InfoItem from "./components/InfoItem.svelte";
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

  type ServerBooking = PageData["bookings"][number];

  const toStockholmTime = (date: Date | string) =>
    Temporal.Instant.from(
      date instanceof Date ? date.toISOString() : date,
    ).toZonedDateTimeISO("Europe/Stockholm");

  const getDisplayName = (booking: ServerBooking) => {
    const fullName = [booking.booker?.firstName, booking.booker?.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();
    return fullName || "Unknown";
  };

  const getDisplayInitials = (booking: ServerBooking) => {
    const firstInitial = booking.booker?.firstName?.charAt(0);
    const lastInitial = booking.booker?.lastName?.charAt(0);
    if (firstInitial && lastInitial) return `${firstInitial}${lastInitial}`;
    return "NN";
  };

  const toCalendarBooking = (
    booking: ServerBooking,
  ): BookingCalendarEvent | null => {
    if (!booking.start || !booking.end) return null;

    const location = booking.bookables[0]?.name ?? "Unknown";

    return createBookingEvent({
      id: booking.id,
      title: booking.event ?? "Booking",
      start: toStockholmTime(booking.start),
      end: toStockholmTime(booking.end),
      calendarId: booking.status,
      description: booking.event ?? "",
      location,
      bookerName: getDisplayName(booking),
      bookerStudentId: booking.booker?.studentId ?? "Unknown",
      bookerAvatarUrl: booking.booker?.picturePath ?? "",
      bookerInitials: getDisplayInitials(booking),
    });
  };

  const bookings = $derived.by(() =>
    data.bookings
      .map(toCalendarBooking)
      .filter((booking): booking is BookingCalendarEvent => booking !== null),
  );

  onMount(() => {
    sessionStorage.setItem("bookings", JSON.stringify(bookings));
  });

  // TODO: Pass actual categories from server
  const defaultCategory = {
    value: "all categories",
    label: m.booking_allCategories(),
  };

  const activeBookingIds = new SvelteSet<CalendarEventExternal["id"]>();
  const currentStudentId = $derived(page.data.user?.studentId ?? null);
  const currentCategoryValue = $derived(
    page.url.searchParams.get("category") ?? defaultCategory.value,
  );
  const filteredBookings = $derived.by(() => {
    const isMyBookingsFilter = page.url.searchParams.has("mine");
    const isDefaultCategory = currentCategoryValue === defaultCategory.value;

    return bookings.filter((booking) => {
      if (!isDefaultCategory && booking.location !== currentCategoryValue) {
        return false;
      }

      if (
        isMyBookingsFilter &&
        (!currentStudentId || booking.bookerStudentId !== currentStudentId)
      ) {
        return false;
      }

      return true;
    });
  });

  const acceptedCount = $derived(
    filteredBookings.filter((booking) => booking.calendarId === "ACCEPTED")
      .length,
  );
  const pendingCount = $derived(
    filteredBookings.filter((booking) => booking.calendarId === "PENDING")
      .length,
  );
  const deniedCount = $derived(
    filteredBookings.filter((booking) => booking.calendarId === "DENIED")
      .length,
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
