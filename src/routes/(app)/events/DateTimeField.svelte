<script lang="ts">
  import DatePicker from "$lib/components/datetime-selector/DatePicker.svelte";
  import TimePicker from "$lib/components/datetime-selector/TimePicker.svelte";
  import {
    CalendarDateTime,
    fromDate,
    getLocalTimeZone,
    parseDate,
    parseTime,
    toCalendarDate,
    toTime,
    type Time,
  } from "@internationalized/date";

  let {
    value = $bindable(),
    dateOnly = false,
    invalid = false,
  }: {
    value: Date;
    /**
     * Only pick a date. The time is then set to the end of that day so that
     * "the last day" is still included when it is compared to a start time.
     */
    dateOnly?: boolean;
    invalid?: boolean;
  } = $props();

  const tz = getLocalTimeZone();

  const date = $derived(toCalendarDate(fromDate(value, tz)).toString());
  const time = $derived(toTime(fromDate(value, tz)));

  function update(newDate: string, newTime: Time) {
    const parsed = parseDate(newDate);
    value = new CalendarDateTime(
      parsed.year,
      parsed.month,
      parsed.day,
      newTime.hour,
      newTime.minute,
    ).toDate(tz);
  }

  const endOfDay = parseTime("23:59");
</script>

<div class="flex flex-row flex-wrap items-center gap-2">
  <DatePicker
    error={invalid}
    bind:value={() => date,
    (newDate) => update(newDate, dateOnly ? endOfDay : time)}
  />
  {#if !dateOnly}
    <TimePicker bind:value={() => time, (newTime) => update(date, newTime)} />
  {/if}
</div>
