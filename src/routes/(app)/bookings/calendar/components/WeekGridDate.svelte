<script lang="ts">
  import { days } from "./utils";

  const { date }: { date: string } = $props();

  const today = Temporal.Now.plainDateISO("Europe/Stockholm");
  let temporalDate = $derived(Temporal.PlainDate.from(date));
  let currentDay = $derived(days[temporalDate.dayOfWeek - 1]?.substring(0, 3));
</script>

<div class="text-center">
  <span
    class={`mb-1 block text-xs font-bold uppercase opacity-60 ${today.equals(temporalDate) ? "text-primary opacity-75" : ""}`}
    >{currentDay}</span
  >
  <span
    class={`text-2xl font-bold ${today.equals(temporalDate) ? "text-primary underline decoration-3 underline-offset-3" : ""}`}
    >{temporalDate.day}</span
  >
</div>
