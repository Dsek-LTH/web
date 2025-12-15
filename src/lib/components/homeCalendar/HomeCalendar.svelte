<script lang="ts">
  import dayjs from "dayjs";

  const {
    events,
  }: {
    events: Array<{
      startDate: Date;
      endDate: Date;
      title: string;
      slug: string;
    }>;
  } = $props();
  const mapped = events.map((e) => ({
    ...e,
    diff: dayjs(e.endDate).diff(dayjs(e.startDate), "day"),
    // Calculate which column the event should start in (1-7) based on days from today
    startDateNumber: Math.max(
      1,
      Math.min(7, dayjs(e.startDate).diff(dayjs().startOf("day"), "day") + 1),
    ),
    endDateNumber: Math.min(
      8,
      dayjs(e.endDate).diff(dayjs().startOf("day"), "day") + 2,
    ),
  }));

  const allDays = Array.from(Array(7).keys()).map((i) => dayjs().add(i, "day"));

  const mobileDays = Array.from(Array(3).keys()).map((i) =>
    dayjs().add(i, "day"),
  );

  const isInProgress = (start: Date, end: Date) => {
    const now = dayjs(new Date());
    return now.isAfter(dayjs(start)) && now.isBefore(dayjs(end));
  };

  const isEventInMobileRange = (event: (typeof mapped)[0]) => {
    const eventStart = dayjs(event.startDate);
    const eventEnd = dayjs(event.endDate);
    const rangeEnd = dayjs().add(2, "day").endOf("day");
    const rangeStart = dayjs().startOf("day");

    return eventStart.isBefore(rangeEnd) && eventEnd.isAfter(rangeStart);
  };
</script>

{#snippet eventCard(event: (typeof mapped)[0])}
  <a
    href={`/events/${event.slug}`}
    class={`hover:bg-secondary-hover rounded-md border-2 p-3 ${dayjs(event.startDate).isBefore(allDays[0]?.startOf("day")) ? "rounded-l-none" : ""} ${dayjs(event.endDate).isAfter(allDays[allDays.length - 1]?.endOf("day")) ? "rounded-r-none" : ""} ${isInProgress(event.startDate, event.endDate) ? "bg-rosa-50 dark:bg-rosa-950 border-rosa-500" : ""}`}
    style="grid-column-start: {event.startDateNumber}; grid-column-end: {event.endDateNumber};"
  >
    <div class="line-clamp-1 font-sans text-sm font-medium">
      {event.title}
    </div>
    <div class="text-muted-foreground">
      {#if event.diff > 0}
        {dayjs(event.startDate).format("DD/MM HH:mm")} - {dayjs(
          event.endDate,
        ).format("DD/MM HH:mm")}{:else}
        {dayjs(event.startDate).format("HH:mm")} - {dayjs(event.endDate).format(
          "HH:mm",
        )}
      {/if}
    </div>
  </a>
{/snippet}

<div
  class="grid auto-rows-fr grid-cols-3 gap-4 lg:hidden"
  style="grid-auto-flow: dense;"
>
  {#each mobileDays as day, index}
    <div class="col-span-1 flex flex-row items-center">
      <div class="flex flex-row">
        <h3 class={day.isSame(dayjs(new Date()), "day") ? "text-pink-400" : ""}>
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
  {#each mapped.filter(isEventInMobileRange) as event}
    {@render eventCard({
      ...event,
      startDateNumber: Math.max(
        1,
        Math.min(
          3,
          dayjs(event.startDate).diff(dayjs().startOf("day"), "day") + 1,
        ),
      ),
      endDateNumber: Math.min(
        4,
        dayjs(event.endDate).diff(dayjs().startOf("day"), "day") + 2,
      ),
    })}
  {/each}
</div>

<div
  class="hidden auto-rows-fr gap-4 lg:grid lg:grid-cols-7"
  style="grid-auto-flow: dense;"
>
  {#each allDays as day}
    <div class="col-span-1 flex flex-row items-center">
      <div class="flex flex-row">
        <h3 class={day.isSame(dayjs(new Date()), "day") ? "text-pink-400" : ""}>
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
  {#each mapped as event}
    {@render eventCard(event)}
  {/each}
</div>
