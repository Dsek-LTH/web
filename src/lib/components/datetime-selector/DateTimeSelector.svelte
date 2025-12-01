<script lang="ts">
  import {
    CalendarDate,
    CalendarDateTime,
    Time,
    toCalendarDate,
    toTime as toTimeConv,
    toCalendarDateTime,
  } from "@internationalized/date";
  import DatePicker from "./DatePicker.svelte";
  import TimePicker from "./TimePicker.svelte";
  import { writable } from "svelte/store";
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
  }: { fromDateTime?: CalendarDateTime; toDateTime?: CalendarDateTime } =
    $props();

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

  /*const f: (x: CalendarDateTime) => void = (x) => {
    fromDate = toCalendarDate(fromDateTime);
    fromTime = toTimeConv(fromDateTime);
  };
  const fInv: (x: CalendarDate, y: Time) => void = (x, y) =>
    (fromDateTime = toCalendarDateTime(x, y));

  const t: (x: CalendarDateTime) => void = (x) => {
    toDate = toCalendarDate(toDateTime);
    toTime = toTimeConv(toDateTime);
  };
  const tInv: (x: CalendarDate, y: Time) => void = (x, y) =>
    (toDateTime = toCalendarDateTime(x, y));

  $effect(() => f(fromDateTime));
  $effect(() => fInv(fromDate, fromTime));
  $effect(() => t(toDateTime));
  $effect(() => tInv(toDate, toTime));*/
</script>

<div class="flex flex-col gap-2">
  <DatePicker bind:value={fromDate}></DatePicker>
  <div class="flex items-center gap-2">
    <TimePicker bind:value={fromTime}></TimePicker>
    <div class="bg-border h-px flex-1"></div>
    <TimePicker bind:value={toTime}></TimePicker>
  </div>
  <DatePicker bind:value={toDate}></DatePicker>
</div>
