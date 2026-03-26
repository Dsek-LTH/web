<script lang="ts">
  import * as m from "$paraglide/messages";
  import Button from "$lib/components/ui/button/button.svelte";
  import ChevronLeft from "@lucide/svelte/icons/chevron-left";
  import ChevronRight from "@lucide/svelte/icons/chevron-right";
  import * as ToggleGroup from "$lib/components/ui/toggle-group";
  import { CalendarApp } from "@schedule-x/calendar";
  import { createCalendarControlsPlugin } from "@schedule-x/calendar-controls";
  import Separator from "$lib/components/ui/separator/separator.svelte";
  import { Plus } from "@lucide/svelte";
  import { page } from "$app/state";
  import { months } from "./utils";

  type CalendarAppParams = ConstructorParameters<typeof CalendarApp>[0];

  const { $app: app }: { $app: CalendarAppParams } = $props();

  const calendarControls = $derived(
    app.config.plugins["calendarControls"] as ReturnType<
      typeof createCalendarControlsPlugin
    >,
  );
  let currentDate = $derived(calendarControls.getDate());
  const currentWeek = $derived(currentDate.weekOfYear);
  const currentMonth = $derived(months[currentDate.month - 1]);
  const currentYear = $derived(currentDate.year);

  $effect(() => calendarControls.setDate(currentDate));
</script>

<div class="p-4">
  <span class="text-4xl font-bold uppercase"
    >{currentMonth + " " + currentYear}</span
  >
  <div class="flex size-full items-center gap-4 pt-3">
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
      onclick={() =>
        (currentDate = Temporal.Now.plainDateISO("Europe/Stockholm"))}
      >{m.booking_today()}</Button
    >
    <div class="flex-1"></div>
    <ToggleGroup.Root
      type="single"
      variant="default"
      spacing={3}
      size="lg"
      value="a"
    >
      <ToggleGroup.Item
        class="ring-primary/30 text-muted-foreground data-[state=on]:text-foreground p-4 data-[state=on]:ring"
        value="a">{m.booking_allBookings()}</ToggleGroup.Item
      >
      <ToggleGroup.Item
        class="ring-primary/30 text-muted-foreground data-[state=on]:text-foreground p-4 data-[state=on]:ring"
        value="b">{m.booking_myBookings()}</ToggleGroup.Item
      >
    </ToggleGroup.Root>
    <div class="h-6 w-fit">
      <Separator class="opacity-50" orientation="vertical" />
    </div>
    <Button class="py-5 has-[>svg]:px-4" href={`${page.url.pathname}/create`}>
      <Plus class="size-4" />
      <span class="font-semibold uppercase">{m.booking_newBooking()}</span>
    </Button>
  </div>
</div>
