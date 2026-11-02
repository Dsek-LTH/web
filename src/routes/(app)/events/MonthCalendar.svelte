<script lang="ts">
  import dayjs, { type Dayjs } from "dayjs";

  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import Button from "$lib/components/ui/button/button.svelte";
  import { eventLink } from "$lib/events/events";
  import {
    getMonthRange,
    layoutMonth,
    type MonthEvent,
  } from "$lib/events/monthCalendar";
  import { APP_TIMEZONE, appDateKey } from "$lib/utils/datetime";
  import ChevronLeft from "@lucide/svelte/icons/chevron-left";
  import ChevronRight from "@lucide/svelte/icons/chevron-right";
  import * as m from "$paraglide/messages";

  // Go's event summaries with their start/end parsed into Dates (see
  // EventList.svelte).
  type CalendarEvent = MonthEvent & {
    committee?: { name: string } | null;
    organizer?: string | null;
  };

  let { events, month }: { events: CalendarEvent[]; month: string } = $props();

  let hoveredEventId = $state<string | null>(null);

  const monthStart = $derived(dayjs.utc(`${month}-01`));
  const todayKey = dayjs().tz(APP_TIMEZONE).format("YYYY-MM-DD");
  const range = $derived(getMonthRange(month));
  const monthEvents = $derived(
    events.filter(
      (event) =>
        event.endDatetime > range.monthStart &&
        event.startDatetime < range.monthEnd,
    ),
  );
  const weeks = $derived(layoutMonth(events, range.weeks));

  const goToMonth = (date: Dayjs) => {
    const url = new URL(page.url);
    url.searchParams.set("month", date.format("YYYY-MM"));
    url.searchParams.delete("page");
    // eslint-disable-next-line svelte/no-navigation-without-resolve -- we use `page.url`
    goto(url, { keepFocus: true, noScroll: true });
  };
</script>

<div class="flex flex-col gap-4 pt-6">
  <div class="flex items-center justify-between gap-4">
    <h2 class="capitalize">{monthStart.format("MMMM YYYY")}</h2>

    <div class="flex gap-2">
      <Button
        variant="outline"
        size="icon-sm"
        aria-label={m.events_calendar_previousMonth()}
        onclick={() => goToMonth(monthStart.subtract(1, "month"))}
      >
        <ChevronLeft />
      </Button>
      <Button
        variant="outline"
        size="icon-sm"
        aria-label={m.events_calendar_nextMonth()}
        onclick={() => goToMonth(monthStart.add(1, "month"))}
      >
        <ChevronRight />
      </Button>
    </div>
  </div>

  <div class="flex flex-col gap-4 lg:hidden">
    {#each monthEvents as event, index (event.id)}
      {@const start = dayjs(event.startDatetime).tz(APP_TIMEZONE)}
      {@const dayKey = appDateKey(event.startDatetime)}
      {@const previousKey =
        index === 0 ? null : appDateKey(monthEvents[index - 1]!.startDatetime)}
      {#if dayKey !== previousKey}
        <h3 class="pt-2 capitalize">{start.format("dddd D MMMM")}</h3>
      {/if}
      <a
        href={eventLink(event)}
        class="border-border hover:bg-secondary-hover flex gap-3 rounded-md border p-3"
      >
        <div class="text-muted-foreground w-14 shrink-0 text-sm">
          {start.format("HH:mm")}
        </div>
        <div class="min-w-0">
          <div class="font-medium" class:line-through={event.isCancelled}>
            {event.title}
          </div>
          {#if event.committee}
            <div class="text-muted-foreground line-clamp-1 text-sm">
              {event.committee.name}
            </div>
          {:else if event.organizer}
            <div class="text-muted-foreground line-clamp-1 text-sm">
              {event.organizer}
            </div>
          {/if}
        </div>
      </a>
    {:else}
      <div
        class="text-muted-foreground flex flex-col items-center gap-1 rounded-xl border-2 border-dashed py-16 text-center"
      >
        <h3>{m.events_no_events_found()}</h3>
        <p class="mt-0">{m.events_change_search_term()}</p>
      </div>
    {/each}
  </div>

  <div class="border-border hidden overflow-hidden rounded-xs border lg:block">
    <div class="overflow-x-auto">
      <div class="min-w-[48rem]">
        <div class="grid grid-cols-7">
          {#each weeks[0]?.days ?? [] as day, dayIndex (day.format("d"))}
            <div
              class="border-border text-muted-foreground border-r border-b px-2 py-2 text-left text-sm font-medium capitalize {dayIndex ===
              6
                ? 'border-r-0'
                : ''}"
            >
              {day.format("dddd")}
            </div>
          {/each}
        </div>

        {#each weeks as { days, events: weekEvents, rowCount }, weekIndex (weekIndex)}
          <div
            class="grid min-h-28 grid-cols-7 gap-y-1"
            style={`grid-template-rows: 2.5rem ${
              rowCount > 0 ? `repeat(${rowCount}, minmax(0, auto)) ` : ""
            }1fr;`}
          >
            {#each days as day, dayIndex (day.format("YYYY-MM-DD"))}
              {@const isToday = day.format("YYYY-MM-DD") === todayKey}
              {@const isInMonth = day.format("YYYY-MM") === month}
              <div
                class="border-border border-r border-b p-2 {dayIndex === 6
                  ? 'border-r-0'
                  : ''} {weekIndex === weeks.length - 1
                  ? 'border-b-0'
                  : ''} {isInMonth ? '' : 'text-muted-foreground'}"
                style={`grid-column: ${dayIndex + 1}; grid-row: 1 / -1;`}
              >
                <div class="flex h-6 items-center">
                  <span
                    class={isToday
                      ? "bg-rosa-background text-rosa-foreground flex size-6 items-center justify-center rounded-full"
                      : ""}
                  >
                    {day.format("D")}
                  </span>
                </div>
              </div>
            {/each}

            {#each weekEvents as event (event.id)}
              {@const start = dayjs(event.startDatetime).tz(APP_TIMEZONE)}
              {@const end = dayjs(event.endDatetime).tz(APP_TIMEZONE)}
              <a
                href={eventLink(event)}
                class={[
                  "border-rosa-background z-10 min-h-[22px] self-start truncate px-2 py-0.5 text-xs",
                  event.continuesBefore ? "ml-0 border-l-0" : "ml-2 border-l-2",
                  event.continuesAfter
                    ? "mr-0 rounded-r-none"
                    : "mr-2 rounded-r-xs",
                  hoveredEventId === event.id
                    ? "bg-rosa-400/20"
                    : "bg-rosa-50/80 dark:bg-rosa-950/80",
                  event.isCancelled && "line-through",
                ]}
                style={`grid-column: ${event.startColumn} / ${event.endColumn}; grid-row: ${event.row + 2};`}
                aria-label={`${event.title}, ${start.format("dddd D MMMM HH:mm")} - ${end.format("dddd D MMMM HH:mm")}`}
                title={`${event.title} (${start.format("DD/MM HH:mm")} - ${end.format("DD/MM HH:mm")})`}
                onmouseenter={() => (hoveredEventId = event.id)}
                onmouseleave={() => (hoveredEventId = null)}
                onfocus={() => (hoveredEventId = event.id)}
                onblur={() => (hoveredEventId = null)}
              >
                {#if !event.continuesBefore}
                  <span class="text-muted-foreground">
                    {start.format("HH:mm")}
                  </span>
                {/if}
                {event.title}
              </a>
            {/each}
          </div>
        {/each}
      </div>
    </div>
  </div>
</div>
