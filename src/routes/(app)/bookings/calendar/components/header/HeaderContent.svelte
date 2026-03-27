<script lang="ts">
  import { CalendarApp, createViewList } from "@schedule-x/calendar";
  import { createCalendarControlsPlugin } from "@schedule-x/calendar-controls";
  import Separator from "$lib/components/ui/separator/separator.svelte";
  import Navigation from "./Navigation.svelte";
  import Filters from "./Filters.svelte";
  import { months } from "../../utils";
  import { page } from "$app/state";
  import * as m from "$paraglide/messages";
  import { Plus } from "@lucide/svelte";
  import { Button } from "$lib/components/ui/button";
  import ViewSwitcher from "./ViewSwitcher.svelte";

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

  let currentView = $derived(calendarControls.getView());
  const views = $derived(
    calendarControls
      .getViews()
      .filter((view) => view.hasSmallScreenCompat)
      .map((view) => ({
        name: view.name,
        label: view.label,
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
</script>

<div class="sx-calendar:p-4">
  <!-- MOBILE -->
  <div class="sx-calendar:hidden mb-5">
    <Filters
      class="flex w-full justify-center rounded-md border border-[var(--sx-color-outline-variant)]"
    />
  </div>

  <div class="sx-calendar:block flex items-center">
    <div class="sx-calendar:block flex flex-col">
      <span class="sx-calendar:text-4xl text-3xl font-semibold uppercase"
        >{currentMonth + " " + currentYear}</span
      >

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
