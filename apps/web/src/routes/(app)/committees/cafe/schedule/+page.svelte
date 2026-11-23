<script lang="ts">
  import type { LayoutData } from "../$types";
  import CafeSchedule from "./CafeSchedule.svelte";
  import dayjs from "dayjs";
  import isoWeek from "dayjs/plugin/isoWeek";
  import type { ScheduleLoadData } from "./schedule.server";

  dayjs.extend(isoWeek);

  let { data }: { data: ScheduleLoadData & LayoutData } = $props();

  let shifts = $derived(data.shifts);

  // Go answers with an ISO week ({year, week}); its Monday is the Monday
  // of the week holding Jan 4th, plus (week - 1) weeks.
  let week = $derived(
    dayjs(`${data.year}-01-04`)
      .startOf("isoWeek")
      .add(data.week - 1, "week"),
  );
</script>

<CafeSchedule
  {week}
  {shifts}
  user={data.user}
  ciabattaOfTheWeek={data.ciabattaOfTheWeek}
/>
