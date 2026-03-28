<script lang="ts">
  import { ScheduleXCalendar } from "@schedule-x/svelte";
  import {
    createCalendar,
    createViewDay,
    createViewList,
    createViewWeek,
    viewWeek,
  } from "@schedule-x/calendar";
  import { createCurrentTimePlugin } from "@schedule-x/current-time";
  import { createScrollControllerPlugin } from "@schedule-x/scroll-controller";
  import { createEventModalPlugin } from "@schedule-x/event-modal";
  import { createCalendarControlsPlugin } from "@schedule-x/calendar-controls";
  import { onMount } from "svelte";
  import { Skeleton } from "$lib/components/ui/skeleton";
  import { mode } from "mode-watcher";
  import TimeGridEvent from "./components/grid/TimeGridEvent.svelte";
  import WeekGridDate from "./components/grid/WeekGridDate.svelte";
  import HeaderContent from "./components/header/HeaderContent.svelte";
  import EventModal from "./components/modal/EventModal.svelte";
  import { calendarStatusCategoriesCSS } from "./config";

  let calendarApp: ReturnType<typeof createCalendar> | undefined = $state();
  const now = Temporal.Now.zonedDateTimeISO("Europe/Stockholm");

  $effect(() => {
    if (calendarApp) {
      calendarApp.setTheme(mode.current === "dark" ? "dark" : "light");
    }
  });

  // TODO: Refactor and clean up
  // TODO: Dynamically load events (for example, list view seems to display all loaded events)
  onMount(() => {
    calendarApp = createCalendar({
      views: [createViewDay(), createViewWeek(), createViewList()],
      plugins: [
        createCurrentTimePlugin(),
        createScrollControllerPlugin({
          initialScroll: now
            .toPlainTime()
            .with({
              hour: Math.max(
                Temporal.Now.plainTimeISO("Europe/Stockholm").hour - 2,
                0,
              ),
            })
            .round({ smallestUnit: "hour" })
            .toString({ smallestUnit: "minute" }),
        }),
        createEventModalPlugin(),
        createCalendarControlsPlugin(),
      ],
      isDark: mode.current === "dark",
      locale: "sv-SE",
      timezone: "Europe/Stockholm",
      defaultView: viewWeek.name,
      showWeekNumbers: true,
      calendars: calendarStatusCategoriesCSS,
      weekOptions: {
        gridHeight: 1250,
      },
      events: [
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
          end: Temporal.ZonedDateTime.from(
            "2026-03-26T04:00:00[Europe/Stockholm]",
          ),
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
          end: Temporal.ZonedDateTime.from(
            "2026-03-26T06:00:00[Europe/Stockholm]",
          ),
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
          end: Temporal.ZonedDateTime.from(
            "2026-03-28T06:00:00[Europe/Stockholm]",
          ),
          calendarId: "pending",
          description: "Test description",
          location: "Styrelserummet",
          people: ["Test Testsson"],
        },
      ],
    });
  });
</script>

{#if !calendarApp}
  <Skeleton class="sx-svelte-calendar-wrapper" />
{:else}
  <ScheduleXCalendar
    {calendarApp}
    timeGridEvent={TimeGridEvent}
    weekGridDate={WeekGridDate}
    headerContent={HeaderContent}
    eventModal={EventModal}
  />
{/if}
