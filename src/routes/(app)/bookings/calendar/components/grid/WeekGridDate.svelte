<script lang="ts">
  import * as m from "$paraglide/messages";
  import { bookingWeekdayLabels } from "$lib/bookings/calendarDateUtils";

  const { date }: { date: string } = $props();

  const today = Temporal.Now.plainDateISO("Europe/Stockholm");
  const temporalDate = $derived(Temporal.PlainDate.from(date));
  const currentDay = $derived(
    bookingWeekdayLabels[temporalDate.dayOfWeek - 1]?.substring(0, 3),
  );
  const currentWeek = $derived(temporalDate.weekOfYear);
</script>

<div class="text-center">
  <span
    class={`mb-1 block text-xs font-bold uppercase opacity-60 ${today.equals(temporalDate) ? "text-primary opacity-75" : ""}`}
    >{currentDay}</span
  >
  <span
    class={`text-2xl font-bold ${today.equals(temporalDate) ? "text-primary underline decoration-3 underline-offset-3" : ""}`}
  >
    {temporalDate.day}
  </span>
  <span
    class="sx-calendar:hidden font-headline absolute top-12 left-4 text-[0.65rem] font-medium tracking-tight uppercase opacity-75"
  >
    ({m.booking_week()}
    {currentWeek})
  </span>
</div>
