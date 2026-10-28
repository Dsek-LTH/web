<script lang="ts">
  import { CalendarApp, createViewList } from "@schedule-x/calendar";
  import { createCalendarControlsPlugin } from "@schedule-x/calendar-controls";
  import Separator from "$lib/components/ui/separator/separator.svelte";
  import Navigation from "./Navigation.svelte";
  import Filters from "./Filters.svelte";
  import { page } from "$app/state";
  import { getBookingViewFilter } from "$lib/bookings/filters";
  import * as m from "$paraglide/messages";
  import { Plus } from "@lucide/svelte";
  import { Button } from "$lib/components/ui/button";
  import ViewSwitcher from "./ViewSwitcher.svelte";
  import dayjs from "dayjs";

  type CalendarAppParams = ConstructorParameters<typeof CalendarApp>[0];

  const { $app: app }: { $app: CalendarAppParams } = $props();

  const calendarControls = $derived(
    app.config.plugins["calendarControls"] as ReturnType<
      typeof createCalendarControlsPlugin
    >,
  );
  let currentDate = $derived(calendarControls.getDate());
  let dCurrentDate = $derived(dayjs(currentDate.toString()));

  const viewLabels: Record<string, string> = {
    day: m.booking_dayView(),
    week: m.booking_weekView(),
    list: m.booking_listView(),
  };

  let currentView = $derived(calendarControls.getView());
  const views = $derived(
    calendarControls
      .getViews()
      .filter((view) => view.hasSmallScreenCompat)
      .map((view) => ({
        name: view.name,
        label: viewLabels[view.name] ?? view.label,
      })),
  );
  const viewListName = createViewList().name;

  const calculateStep = $derived(() => {
    const range = calendarControls.getRange();
    if (!range?.start || !range?.end) return 7;

    return range.start.until(range.end, { largestUnit: "days" }).days + 1;
  });
  let step = $derived(calculateStep());

  $effect(() => calendarControls.setDate(currentDate));
  $effect(() => {
    calendarControls.setView(currentView);
    step = calculateStep();
  });

  const initialFilter = getBookingViewFilter(page.url.searchParams);
</script>

<div class="sx-calendar:p-4">
  <!-- MOBILE -->
  <div class="sx-calendar:hidden mb-5">
    <Filters currentValue={initialFilter} />
  </div>

  <div class="sx-calendar:block flex items-center">
    <div class="sx-calendar:block flex flex-col">
      <h2 class="font-semibold capitalize">
        {dCurrentDate.format("MMMM YYYY")}
      </h2>

      <!-- MOBILE -->
      <div class="sx-calendar:hidden flex items-center gap-2">
        <ViewSwitcher bind:currentView {views} defaultView={currentView} />
      </div>
    </div>

    <!-- MOBILE -->
    {#if currentView !== viewListName}
      <div class="sx-calendar:hidden ml-auto">
        <Navigation bind:currentDate {step} />
      </div>
    {/if}
  </div>

  <!-- DESKTOP -->
  <div class="not-sx-calendar:hidden flex size-full items-center gap-4 pt-3">
    <Navigation bind:currentDate {step} />

    <div class="flex-1"></div>

    <Filters currentValue={initialFilter} />

    <div class="h-6 w-fit">
      <Separator class="opacity-50" orientation="vertical" />
    </div>

    <Button size="lg" href={`${page.url.pathname}/create`}>
      <Plus class="size-4" />
      {m.booking_newBooking()}
    </Button>
  </div>
</div>
