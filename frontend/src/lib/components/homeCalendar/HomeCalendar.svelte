<script lang="ts">
  import dayjs from "dayjs";

  import { eventLink } from "$lib/events/events";
  import { appDateKey, appEndDateKey, APP_TIMEZONE } from "$lib/utils/datetime";
  import { m } from "$paraglide/messages";

  const {
    events,
  }: {
    events: Array<{
      id: string;
      startDate: Date;
      endDate: Date;
      title: string;
      slug?: string;
    }>;
  } = $props();

  const todayKey = dayjs().tz(APP_TIMEZONE).format("YYYY-MM-DD");
  const allDays = Array.from({ length: 7 }, (_, day) =>
    dayjs.utc(todayKey).add(day, "day"),
  );
  const mobileDays = allDays.slice(0, 3);
  const weekEndKey = allDays[6]!.format("YYYY-MM-DD");
  const mobileEndKey = mobileDays[2]!.format("YYYY-MM-DD");

  const mapped = $derived(
    events.map((event) => {
      const startKey = appDateKey(event.startDate);
      const endKey = appEndDateKey(event.endDate);

      return {
        ...event,
        start: dayjs(event.startDate).tz(APP_TIMEZONE),
        end: dayjs(event.endDate).tz(APP_TIMEZONE),
        diff: dayjs.utc(endKey).diff(dayjs.utc(startKey), "day"),
        startDateNumber: Math.max(
          1,
          Math.min(7, dayjs.utc(startKey).diff(dayjs.utc(todayKey), "day") + 1),
        ),
        endDateNumber: Math.min(
          8,
          dayjs.utc(endKey).diff(dayjs.utc(todayKey), "day") + 2,
        ),
        mobileStartDateNumber: Math.max(
          1,
          Math.min(3, dayjs.utc(startKey).diff(dayjs.utc(todayKey), "day") + 1),
        ),
        mobileEndDateNumber: Math.min(
          4,
          dayjs.utc(endKey).diff(dayjs.utc(todayKey), "day") + 2,
        ),
        startsBeforeWeek: startKey < todayKey,
        endsAfterWeek: endKey > weekEndKey,
        startKey,
        endKey,
      };
    }),
  );

  const isEventInMobileRange = (event: (typeof mapped)[0]) =>
    event.startKey <= mobileEndKey && event.endKey >= todayKey;
</script>

{#snippet eventCard(event: (typeof mapped)[0])}
  <a
    href={eventLink(event)}
    class={`hover:bg-secondary-hover rounded-md border-2 p-3 ${event.startsBeforeWeek ? "rounded-l-none" : ""} ${event.endsAfterWeek ? "rounded-r-none" : ""} ${dayjs().isAfter(event.start) && dayjs().isBefore(event.end) ? "bg-rosa-50 dark:bg-rosa-950 border-rosa-500" : ""}`}
    style="grid-column-start: {event.startDateNumber}; grid-column-end: {event.endDateNumber};"
  >
    <div class="line-clamp-1 font-sans text-sm font-medium">
      {event.title}
    </div>
    <div class="text-muted-foreground">
      {#if event.diff > 0}
        {event.start.format("DD/MM HH:mm")} - {event.end.format(
          "DD/MM HH:mm",
        )}{:else}
        {event.start.format("HH:mm")} - {event.end.format("HH:mm")}
      {/if}
    </div>
  </a>
{/snippet}

<div
  class="grid auto-rows-fr grid-cols-3 gap-4 lg:hidden"
  style="grid-auto-flow: dense;"
>
  {#each mobileDays as day, index (index)}
    <div class="col-span-1 flex flex-row items-center">
      <div class="flex flex-row">
        <h3
          class={day.format("YYYY-MM-DD") === todayKey ? "text-rosa-400" : ""}
        >
          {day.get("date")}
        </h3>
        <div
          class="text-muted-foreground place-self-end pb-0.5 pl-2 capitalize"
        >
          {day.format("ddd")}
        </div>
      </div>
    </div>
  {/each}
  {#each mapped.filter(isEventInMobileRange) as event (event.id)}
    {@render eventCard({
      ...event,
      startDateNumber: event.mobileStartDateNumber,
      endDateNumber: event.mobileEndDateNumber,
    })}
  {/each}
  {#if mapped.filter(isEventInMobileRange).length === 0}
    <div
      class="text-muted-foreground col-start-1 col-end-4 flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center"
    >
      <span class="font-medium">{m.home_calendarEmpty()}</span>
    </div>
  {/if}
</div>

<div
  class="hidden auto-rows-fr gap-4 lg:grid lg:grid-cols-7"
  style="grid-auto-flow: dense;"
>
  {#each allDays as day (day)}
    <div class="col-span-1 flex flex-row items-center">
      <div class="flex flex-row">
        <h3
          class={day.format("YYYY-MM-DD") === todayKey ? "text-rosa-400" : ""}
        >
          {day.get("date")}
        </h3>
        <div
          class="text-muted-foreground place-self-end pb-0.5 pl-2 capitalize"
        >
          {day.format("ddd")}
        </div>
      </div>
    </div>
  {/each}
  {#each mapped as event (event.id)}
    {@render eventCard(event)}
  {/each}
  {#if mapped.length === 0}
    <div
      class="text-muted-foreground col-start-1 col-end-8 flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center"
    >
      <span class="font-medium">{m.home_calendarEmpty()}</span>
    </div>
  {/if}
</div>
