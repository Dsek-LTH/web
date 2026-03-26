<script lang="ts">
  import Button from "$lib/components/ui/button/button.svelte";
  import {
    TextAlignStart,
    Clock,
    MapPin,
    User,
    X,
    CalendarPlus,
  } from "@lucide/svelte";
  import type { CalendarEventExternal } from "@schedule-x/calendar";
  import { days, getTime, months } from "./utils";
  import Separator from "$lib/components/ui/separator/separator.svelte";
  import { m } from "$paraglide/messages";

  const { calendarEvent }: { calendarEvent: CalendarEventExternal } = $props();

  const startDate = $derived(calendarEvent.start);
  const startTime = $derived(getTime(startDate));
  const startDay = $derived(startDate.day);
  const startWeekday = $derived(days[startDate.dayOfWeek - 1]);
  const startMonth = $derived(months[startDate.month - 1]);
  const startYear = $derived(startDate.year);

  const endDate = $derived(calendarEvent.end);
  const endTime = $derived(getTime(endDate));
  const endDay = $derived(endDate.day);
  const endMonth = $derived(months[endDate.month - 1]);
  const endYear = $derived(endDate.year);
</script>

<div
  class="bg-background border-border/40 w-[340px] rounded-2xl border p-6 shadow-2xl"
>
  <div class="mb-6 flex items-start justify-between">
    <div class="flex items-center gap-2">
      <div
        class="bg-primary h-3 w-3 rounded-[3px] shadow-[0_0_4px_var(--primary)]"
      ></div>
      <h5 class="text-lg font-black tracking-tight uppercase">
        {calendarEvent.title}
      </h5>
    </div>
    <Button
      variant="ghost"
      class="size-fit p-0 has-[>svg]:px-0"
      onclick={() => document.body.click()}><X class="size-5" /></Button
    >
  </div>

  <div class="space-y-4">
    <div class="flex items-center gap-3">
      <Clock class="text-primary size-4" />
      <div>
        <p class="text-xs font-bold">
          {#if startDay === endDay}
            {startDay} {startMonth} {startYear}
          {:else if startYear === endYear}
            {startDay} {startMonth} - {endDay} {endMonth} {endYear}
          {:else}
            {startDay} {startMonth} - {endDay} {endMonth} {endYear}
          {/if}
        </p>
        <p class="text-muted-foreground mt-0.5 font-mono text-[10px]">
          {#if startDay === endDay}
            {startTime} - {endTime}
          {:else}
            {m.events_startTime()} {startWeekday} @ {startTime}
          {/if}
        </p>
      </div>
    </div>

    <div class="flex items-center gap-3">
      <User class="text-primary size-4" />
      <div>
        <p class="text-xs font-bold">{calendarEvent.people}</p>
      </div>
    </div>

    <div class="flex items-center gap-3">
      <MapPin class="text-primary size-4" />
      <div>
        <p class="text-xs font-bold">{calendarEvent.location}</p>
      </div>
    </div>

    <Separator class="bg-muted mt-5 mb-2" />

    <div class="mt-0 flex items-center gap-3">
      <div>
        <TextAlignStart class="text-muted-foreground h-4 w-4" />
      </div>
      <div>
        <p class="text-muted-foreground text-[11px] leading-relaxed">
          {calendarEvent.description}
        </p>
      </div>
    </div>
  </div>

  <div class="mt-6">
    <Button class="w-full">
      <CalendarPlus class="size-4" />
      <span class="uppercase"> Add to my calendar </span>
    </Button>
  </div>
</div>
