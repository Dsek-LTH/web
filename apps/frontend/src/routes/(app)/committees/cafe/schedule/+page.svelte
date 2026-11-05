<script lang="ts">
  import type { LayoutData } from "../$types";
  import CafeSchedule from "./CafeSchedule.svelte";
  import dayjs from "dayjs";
  import type { ScheduleLoadData } from "./schedule.server";

  let { data }: { data: ScheduleLoadData & LayoutData } = $props();

  let shifts = $derived(data.shifts);

  let week = $derived(
    dayjs()
      .startOf("year")
      .add(data.week - 1, "week"),
  );
</script>

<CafeSchedule
  bind:week
  {shifts}
  user={data.user}
  ciabattaOfTheWeek={data.ciabattaOfTheWeek}
/>
