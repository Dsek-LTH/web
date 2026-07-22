<script lang="ts">
  import * as m from "$paraglide/messages";
  import { Clock } from "@lucide/svelte";
  import {
    formatBookingTime,
    bookingMonthLabels,
    bookingWeekdayLabels,
  } from "$lib/bookings/calendar/dateUtils";
  import Section from "./Section.svelte";

  type PropDate = Temporal.ZonedDateTime | Temporal.PlainDate;

  const { startDate, endDate }: { startDate: PropDate; endDate: PropDate } =
    $props();

  const startTime = $derived(formatBookingTime(startDate));
  const startDay = $derived(startDate.day);
  const startWeekday = $derived(bookingWeekdayLabels[startDate.dayOfWeek - 1]);
  const startMonth = $derived(bookingMonthLabels[startDate.month - 1]);
  const startYear = $derived(startDate.year);

  const endTime = $derived(formatBookingTime(endDate));
  const endDay = $derived(endDate.day);
  const endMonth = $derived(bookingMonthLabels[endDate.month - 1]);
  const endYear = $derived(endDate.year);

  let header = $state("");
  let description = $state("");

  $effect(() => {
    const isSameDay = startDay === endDay;
    const isSameYear = startYear === endYear;

    if (isSameDay) {
      header = `${startDay} ${startMonth} ${startYear}`;
      description = `${startTime} - ${endTime}`;
    } else {
      header = isSameYear
        ? `${startDay} ${startMonth} - ${endDay} ${endMonth} ${endYear}`
        : `${startDay} ${startMonth} ${startYear} - ${endDay} ${endMonth} ${endYear}`;

      description = `${m.events_startTime()} ${startWeekday} @ ${startTime}`;
    }
  });
</script>

<Section Icon={Clock} {header} {description} />
