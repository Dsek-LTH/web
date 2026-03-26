<script lang="ts">
  import type { CalendarEventExternal } from "@schedule-x/calendar";
  import { getTime } from "./utils";

  const { calendarEvent }: { calendarEvent: CalendarEventExternal } = $props();

  const startTime = $derived(getTime(calendarEvent.start));

  type EdgeMode = "start" | "both" | "end" | "none";

  let edgeMode: EdgeMode = $state("none");

  const now = Temporal.Now.plainDateISO("Europe/Stockholm");
  $effect(() => {
    const yearNow = now.yearOfWeek;
    const yearEnd = calendarEvent.end.yearOfWeek;
    const yearStart = calendarEvent.start.yearOfWeek;
    const weekNow = now.weekOfYear;
    const weekEnd = calendarEvent.end.weekOfYear;
    const weekStart = calendarEvent.start.weekOfYear;

    const isAfterWeek = (
      aYear?: number,
      aWeek?: number,
      bYear?: number,
      bWeek?: number,
    ) => {
      if (
        aYear === undefined ||
        aWeek === undefined ||
        bYear === undefined ||
        bWeek === undefined
      )
        return false;

      return aYear > bYear || (aYear === bYear && aWeek > bWeek);
    };

    const isBeforeWeek = (
      aYear?: number,
      aWeek?: number,
      bYear?: number,
      bWeek?: number,
    ) => {
      if (
        aYear === undefined ||
        aWeek === undefined ||
        bYear === undefined ||
        bWeek === undefined
      )
        return false;

      return aYear < bYear || (aYear === bYear && aWeek < bWeek);
    };
    console.log(weekNow, weekEnd, weekStart);

    if (
      Temporal.PlainDate.compare(now, calendarEvent.start.toPlainDateTime()) <=
      0
    ) {
      edgeMode = isAfterWeek(yearEnd, weekEnd, yearNow, weekNow)
        ? "end"
        : "none";
    } else {
      const startedBefore = isBeforeWeek(
        yearStart,
        weekStart,
        yearNow,
        weekNow,
      );

      const endsAfter = isAfterWeek(yearEnd, weekEnd, yearNow, weekNow);

      if (startedBefore && endsAfter) {
        edgeMode = "both";
      } else if (startedBefore) {
        edgeMode = "start";
      } else {
        edgeMode = "none";
      }
    }

    console.log(edgeMode);
  });

  const getEdges = (edgeMode: EdgeMode) => {
    const endOrNone =
      "before:bg-primary before:absolute before:top-0 before:left-0 before:h-full before:w-1 before:rounded-l-md before:content-['']";

    switch (edgeMode) {
      case "start":
        return "rounded-l-xs";
      case "both":
        return "";
      case "end":
        return endOrNone;
      case "none":
        return endOrNone + " rounded-r-xs";
    }
  };

  $effect(() => console.log(getEdges(edgeMode)));
</script>

<div class="flex">
  {#if edgeMode === "start" || edgeMode === "both"}
    <div class="sx__date-grid-event--left-overflow bg-primary/15"></div>
  {/if}
  <div class={`bg-primary/15 text-primary w-full pl-2 ${getEdges(edgeMode)}`}>
    <div class="flex gap-2">
      <span>{calendarEvent.location}</span>
      {#if startTime !== "00:00"}
        <span class="font-normal">{startTime}</span>
      {/if}
    </div>
  </div>
  {#if edgeMode === "end" || edgeMode === "both"}
    <div class="sx__date-grid-event--right-overflow bg-primary/15"></div>
  {/if}
</div>
