<script lang="ts">
  import BookingsCalendar from "./calendar/BookingsCalendar.svelte";
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
  import { untrack } from "svelte";
  import { SvelteSet } from "svelte/reactivity";

  let calendarApp: CalendarApp | undefined = $state();
  const eventsServicePlugin = createEventsServicePlugin();

  // TODO: Show location on DateGridEvents instead of title
  const bookings: CalendarEventExternal[] = [
    {
      id: "1",
      title: "Event 1",
      start: Temporal.PlainDate.from("2026-03-27"),
      end: Temporal.PlainDate.from("2026-03-30"),
      calendarId: "accepted",
      description: "Pub",
      location: "iDét",
      people: ["Test Testsson"],
    },
    {
      id: "2",
      title: "Event 2",
      start: Temporal.ZonedDateTime.from(
        "2026-03-26T01:00:00[Europe/Stockholm]",
      ),
      end: Temporal.ZonedDateTime.from("2026-03-26T04:00:00[Europe/Stockholm]"),
      calendarId: "accepted",
      description: "Pub",
      location: "iDét",
      people: ["Test Testsson"],
    },
    {
      id: "3",
      title: "Styrelsemöte",
      start: Temporal.ZonedDateTime.from(
        "2026-03-26T02:00:00[Europe/Stockholm]",
      ),
      end: Temporal.ZonedDateTime.from("2026-03-26T06:00:00[Europe/Stockholm]"),
      calendarId: "rejected",
      description: "Test description",
      location: "Styrelserummet",
      people: ["Test Testsson"],
    },
    {
      id: "4",
      title: "Event 4",
      start: Temporal.ZonedDateTime.from(
        "2026-03-27T02:00:00[Europe/Stockholm]",
      ),
      end: Temporal.ZonedDateTime.from("2026-03-28T06:00:00[Europe/Stockholm]"),
      calendarId: "pending",
      description: "Test description",
      location: "Styrelserummet",
      people: ["Test Testsson"],
    },
  ];

  // TODO: Pass actual categories from server
  const defaultCategory = { value: "all categories", label: "all categories" };
  let currentCategory = $state(defaultCategory.value);

  const activeBookingIds = new SvelteSet<CalendarEventExternal["id"]>();

  $effect(() => {
    if (!untrack(() => calendarApp)) return;

    if (activeBookingIds.size === 0) {
      const existingEvents = eventsServicePlugin.getAll();
      existingEvents.forEach((event) => {
        activeBookingIds.add(event.id);
      });
    }

    const shouldShowAll = currentCategory === defaultCategory.value;

    const nextVisibleBookings = bookings.filter(
      (booking) => shouldShowAll || booking.location === currentCategory,
    );

    const nextVisibleIds = new Set(
      nextVisibleBookings.map((booking) => booking.id),
    );

    for (const id of activeBookingIds) {
      if (!nextVisibleIds.has(id)) {
        eventsServicePlugin.remove(id);
        activeBookingIds.delete(id);
      }
    }

    for (const booking of nextVisibleBookings) {
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

<!-- TODO: Read actual data -->
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
      <StatusItem mode="desktop" variant="accepted" count={4} />
      <StatusItem mode="desktop" variant="pending" count={2} />
      <StatusItem mode="desktop" variant="rejected" count={0} />
    </div>
  </div>

  <Filter bind:currentCategory {bookings} {defaultCategory} />

  <div class="sx-calendar:hidden flex justify-between gap-3">
    <StatusItem mode="mobile" variant="accepted" count={4} />
    <StatusItem mode="mobile" variant="pending" count={2} />
    <StatusItem mode="mobile" variant="rejected" count={0} />
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
