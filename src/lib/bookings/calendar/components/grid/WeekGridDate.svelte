<script lang="ts">
  import * as m from "$paraglide/messages";
  import dayjs from "dayjs";
  import localeData from "dayjs/plugin/localeData";
  import weekOfYear from "dayjs/plugin/weekOfYear";

  dayjs.extend(localeData);
  dayjs.extend(weekOfYear);

  const { date }: { date: string } = $props();

  const today = dayjs();
  const dayjsDate = $derived(dayjs(date));
  const currentDay = $derived(dayjs.weekdaysShort()[dayjsDate.day()]);
  const currentWeek = $derived(dayjs().week());
</script>

<div class="text-center">
  <span
    class={`mb-1 block text-xs font-bold opacity-60 ${today.date() == dayjsDate.date() ? "text-primary opacity-75" : ""}`}
    >{currentDay}</span
  >
  <span
    class={`text-2xl font-bold ${today.date() == dayjsDate.date() ? "text-primary underline decoration-3 underline-offset-3" : ""}`}
  >
    {dayjsDate.date()}
  </span>
  <span
    class="sx-calendar:hidden font-headline absolute top-12 left-4 text-[0.65rem] font-medium tracking-tight uppercase opacity-75"
  >
    ({m.booking_week()}
    {currentWeek})
  </span>
</div>
