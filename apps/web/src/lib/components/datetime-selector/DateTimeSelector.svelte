<script lang="ts">
  import {
    CalendarDateTime,
    toCalendarDate,
    toTime as toTimeConv,
    toCalendarDateTime,
    parseDate,
  } from "@internationalized/date";
  import type { Time } from "@internationalized/date";
  import DatePicker from "./DatePicker.svelte";
  import TimePicker from "./TimePicker.svelte";
  import * as m from "$paraglide/messages";

  const now = new Date();

  let {
    fromDateTime = $bindable(
      new CalendarDateTime(
        now.getFullYear(),
        now.getMonth() + 1,
        now.getDate(),
        now.getHours(),
        now.getMinutes(),
      ),
    ),
    toDateTime = $bindable(fromDateTime.add({ minutes: 30 })),
    onTimeChange = () => {
      // do nothing
    },
  }: {
    fromDateTime?: CalendarDateTime;
    toDateTime?: CalendarDateTime;
    onTimeChange?: (
      time: {
        fromCalendarDateTime: CalendarDateTime;
        toCalendarDateTime: CalendarDateTime;
      },
      error: boolean,
    ) => void;
  } = $props();

  // The date and time pickers each edit one part of `fromDateTime`/
  // `toDateTime`; these are read-only views of that same value, and each
  // picker's own setter (below) reconstructs the full `CalendarDateTime` and
  // writes it back, rather than this component keeping separate state that
  // would need to be kept in sync with the props in both directions.
  const fromDate = $derived(toCalendarDate(fromDateTime));
  const fromTime = $derived(toTimeConv(fromDateTime));
  const toDate = $derived(toCalendarDate(toDateTime));
  const toTime = $derived(toTimeConv(toDateTime));

  const setFromDate = (newDate: string) => {
    fromDateTime = toCalendarDateTime(parseDate(newDate), fromTime);
  };
  const setFromTime = (newTime: Time) => {
    fromDateTime = toCalendarDateTime(fromDate, newTime);
  };
  const setToDate = (newDate: string) => {
    toDateTime = toCalendarDateTime(parseDate(newDate), toTime);
  };
  const setToTime = (newTime: Time) => {
    toDateTime = toCalendarDateTime(toDate, newTime);
  };

  let err = $derived(fromDateTime.compare(toDateTime) > 0);

  // maybe not the best way to implement this, but found no good way to
  // allow for e.preventDefault on form elements aside from exposing error
  $effect(() => {
    onTimeChange(
      { fromCalendarDateTime: fromDateTime, toCalendarDateTime: toDateTime },
      err,
    );
  });
</script>

<div class="flex w-min min-w-[16rem] flex-col gap-2">
  <DatePicker bind:value={() => fromDate.toString(), setFromDate} class="w-full"
  ></DatePicker>
  <div class="flex items-center gap-2">
    <TimePicker bind:value={() => fromTime, setFromTime}></TimePicker>
    <div class="bg-border h-px flex-1"></div>
    <TimePicker bind:value={() => toTime, setToTime}></TimePicker>
  </div>
  <DatePicker
    error={err}
    bind:value={() => toDate.toString(), setToDate}
    class="w-full"
  ></DatePicker>
  {#if err}<p class="text-rosa-background">
      {m.datetimeselector_range_error()}
    </p>{/if}
  <input type="hidden" name="fromCalendarDateTime" value={fromDateTime} />
  <input type="hidden" name="toCalendarDateTime" value={toDateTime} />
</div>
