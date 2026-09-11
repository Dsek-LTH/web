<script lang="ts">
  import * as m from "$paraglide/messages";
  import { getLocale } from "$paraglide/runtime";
  import dayjs from "dayjs";

  import weekYear from "dayjs/plugin/weekYear";
  import weekOfYear from "dayjs/plugin/weekOfYear";
  let { data }: { data: PageData } = $props();

  let isEditing = $state(false);

  const getWeekdayName = (weekday: number): string => {
    let date = new Date();
    // we assign monday to 0, not sunday
    while (date.getDay() - 1 !== weekday) {
      date.setDate(date.getDate() + 1);
    }
    return date.toLocaleString(getLocale(), {
      weekday: "long",
    });
  };
  dayjs.extend(weekOfYear);
  dayjs.extend(weekYear);

  let week = $derived(
    dayjs()
      .startOf("year")
      .add(data.week - 1, "week"),
  );

  let shifts = $derived(data.shifts);
  import { type PageData } from "./$types";
  import CafeBookingCalendar from "./CafeBookingCalendar.svelte";
</script>

<CafeBookingCalendar
  bind:week
  {shifts}
  user={data.user}
  ciabattaOfTheWeek={data.ciabattaOfTheWeek}
/>
