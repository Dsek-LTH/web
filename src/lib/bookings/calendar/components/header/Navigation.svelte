<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import * as m from "$paraglide/messages";
  import { ChevronLeft, ChevronRight } from "@lucide/svelte";

  let {
    currentDate = $bindable(),
    step,
  }: { currentDate: Temporal.PlainDate; step: number } = $props();

  const currentWeek = $derived(currentDate.weekOfYear);
</script>

<Button
  variant="ghost"
  class="size-10"
  onclick={() => (currentDate = currentDate.subtract({ days: step }))}
>
  <ChevronLeft class="sx-calendar:size-5 size-7" />
</Button>
<span class="text-primary not-sx-calendar:hidden font-semibold uppercase"
  >{m.booking_week() + " " + currentWeek}</span
>

<Button
  variant="ghost"
  class="size-10"
  onclick={() => (currentDate = currentDate.add({ days: step }))}
>
  <ChevronRight class="sx-calendar:size-5 size-7" />
</Button>

<Button
  class="not-sx-calendar:hidden -ml-3 p-4 uppercase"
  variant="ghost"
  onclick={() => (currentDate = Temporal.Now.plainDateISO("Europe/Stockholm"))}
  >{m.booking_today()}</Button
>
