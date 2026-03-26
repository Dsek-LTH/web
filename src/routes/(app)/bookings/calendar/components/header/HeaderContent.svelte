<script lang="ts">
  import { CalendarApp } from "@schedule-x/calendar";
  import { createCalendarControlsPlugin } from "@schedule-x/calendar-controls";
  import Separator from "$lib/components/ui/separator/separator.svelte";
  import Navigation from "./Navigation.svelte";
  import Filters from "./Filters.svelte";
  import { months } from "../../utils";
  import { page } from "$app/state";
  import * as m from "$paraglide/messages";
  import { Plus } from "@lucide/svelte";
  import { Button } from "$lib/components/ui/button";

  type CalendarAppParams = ConstructorParameters<typeof CalendarApp>[0];

  const { $app: app }: { $app: CalendarAppParams } = $props();

  const calendarControls = $derived(
    app.config.plugins["calendarControls"] as ReturnType<
      typeof createCalendarControlsPlugin
    >,
  );
  let currentDate = $derived(calendarControls.getDate());
  const currentMonth = $derived(months[currentDate.month - 1]);
  const currentYear = $derived(currentDate.year);

  $effect(() => calendarControls.setDate(currentDate));
</script>

<div class="p-4">
  <span class="text-4xl font-bold uppercase"
    >{currentMonth + " " + currentYear}</span
  >

  <div class="flex size-full items-center gap-4 pt-3">
    <Navigation bind:currentDate />

    <div class="flex-1"></div>

    <Filters />

    <div class="h-6 w-fit">
      <Separator class="opacity-50" orientation="vertical" />
    </div>

    <Button class="py-5 has-[>svg]:px-4" href={`${page.url.pathname}/create`}>
      <Plus class="size-4" />
      <span class="font-semibold uppercase">{m.booking_newBooking()}</span>
    </Button>
  </div>
</div>
