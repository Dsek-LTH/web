<script lang="ts">
  import {
    CalendarDateTime,
    toCalendarDate,
    toTime as toTimeConv,
    toCalendarDateTime,
  } from "@internationalized/date";
  import DatePicker from "./DatePicker.svelte";
  import TimePicker from "./TimePicker.svelte";
  import { untrack } from "svelte";

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
    onTimeChange = () => {},
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

  let fromDate = $state(toCalendarDate(fromDateTime)),
    fromTime = $state(toTimeConv(fromDateTime)),
    toDate = $state(toCalendarDate(toDateTime)),
    toTime = $state(toTimeConv(toDateTime));

  $effect(() => {
    let oldDate = toCalendarDate(untrack(() => fromDateTime));
    if (oldDate != fromDate) {
      fromDateTime = toCalendarDateTime(fromDate, fromTime);
    }
  });

  $effect(() => {
    let oldDate = toTimeConv(untrack(() => fromDateTime));
    if (oldDate != fromTime) {
      fromDateTime = toCalendarDateTime(fromDate, fromTime);
    }
  });

  $effect(() => {
    let oldDate = toCalendarDate(untrack(() => toDateTime));
    if (oldDate != toDate) {
      toDateTime = toCalendarDateTime(toDate, toTime);
    }
  });

  $effect(() => {
    let oldDate = toTimeConv(untrack(() => toDateTime));
    if (oldDate != toTime) {
      toDateTime = toCalendarDateTime(toDate, toTime);
    }
  });

  $effect(() => {
    fromDate.set(toCalendarDate(fromDateTime));
  });
  $effect(() => {
    fromTime.set(toTimeConv(fromDateTime));
  });
  $effect(() => {
    toDate.set(toCalendarDate(fromDateTime));
  });
  $effect(() => {
    toTime.set(toTimeConv(fromDateTime));
  });

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
  <DatePicker bind:value={fromDate} class="w-full"></DatePicker>
  <div class="flex items-center gap-2">
    <TimePicker bind:value={fromTime}></TimePicker>
    <div class="bg-border h-px flex-1"></div>
    <TimePicker bind:value={toTime}></TimePicker>
  </div>
  <DatePicker error={err} bind:value={toDate} class="w-full"></DatePicker>
  {#if err}<p class="text-rosa-background">Range ends before it starts</p>{/if}
  <input type="hidden" name="fromCalendarDateTime" value={fromDateTime} />
  <input type="hidden" name="toCalendarDateTime" value={toDateTime} />
</div>
