<script lang="ts">
  import { ScheduleXCalendar } from "@schedule-x/svelte";
  import {
    type CalendarApp,
    createCalendar,
    createViewDay,
    createViewList,
    createViewWeek,
    viewWeek,
    type PluginBase,
    type CalendarEventExternal,
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

  let {
    calendarApp = $bindable(),
    plugins,
    bookings,
  }: {
    calendarApp: CalendarApp | undefined;
    bookings: CalendarEventExternal[];
    plugins?: Array<PluginBase<string>>;
  } = $props();

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
      plugins: (plugins ?? []).concat([
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
      ]),
      isDark: mode.current === "dark",
      locale: "sv-SE",
      timezone: "Europe/Stockholm",
      defaultView: viewWeek.name,
      showWeekNumbers: true,
      calendars: calendarStatusCategoriesCSS,
      weekOptions: {
        gridHeight: 900,
      },
      events: bookings,
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
