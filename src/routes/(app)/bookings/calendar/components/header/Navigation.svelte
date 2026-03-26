<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import * as m from "$paraglide/messages";
  import { ChevronLeft, ChevronRight } from "@lucide/svelte";

  let { currentDate = $bindable() }: { currentDate: Temporal.PlainDate } =
    $props();

  const currentWeek = $derived(currentDate.weekOfYear);
</script>

<Button
  variant="ghost"
  class="size-10"
  onclick={() => (currentDate = currentDate.subtract({ days: 7 }))}
>
  <ChevronLeft class="size-5" />
</Button>
<span class="text-primary font-semibold uppercase"
  >{m.booking_week() + " " + currentWeek}</span
>

<Button
  variant="ghost"
  class="size-10"
  onclick={() => (currentDate = currentDate.add({ days: 7 }))}
>
  <ChevronRight class="size-5" />
</Button>

<Button
  class="-ml-3 p-4 uppercase"
  variant="ghost"
  onclick={() => (currentDate = Temporal.Now.plainDateISO("Europe/Stockholm"))}
  >{m.booking_today()}</Button
>
