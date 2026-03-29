<script lang="ts">
  import { onMount } from "svelte";
  import * as Avatar from "$lib/components/ui/avatar";
  import type { CalendarEventExternal } from "@schedule-x/calendar";
  import type { BookingCalendarEvent } from "$lib/bookings/eventTypes";
  import { formatBookingTime } from "$lib/bookings/calendarDateUtils";
  import {
    calendarStatusCategoriesTailwind,
    type CalendarStatusCategory,
  } from "../../config";

  const { calendarEvent }: { calendarEvent: CalendarEventExternal } = $props();
  const bookingEvent = $derived(calendarEvent as BookingCalendarEvent);

  const startTime = $derived(formatBookingTime(calendarEvent.start));
  const endTime = $derived(formatBookingTime(calendarEvent.end));

  const category = $derived(
    calendarStatusCategoriesTailwind[
      calendarEvent.calendarId as CalendarStatusCategory
    ] ?? calendarStatusCategoriesTailwind.PENDING,
  );
  const colours = $derived(category.darkColors ?? category.lightColors);
  const colourClasses = $derived(Object.values(colours ?? {}).join(" "));

  const MIN_HEIGHT_FOR_TIME = 38;
  const MIN_HEIGHT_FOR_BOOKER = 58;

  let eventElement: HTMLDivElement | undefined = $state();
  let eventHeight = $state(0);

  const showTime = $derived(eventHeight >= MIN_HEIGHT_FOR_TIME);
  const showBooker = $derived(eventHeight >= MIN_HEIGHT_FOR_BOOKER);

  onMount(() => {
    if (!eventElement) return;

    const resizeObserver = new ResizeObserver(([entry]) => {
      eventHeight = entry?.contentRect.height ?? 0;
    });

    eventHeight = eventElement.getBoundingClientRect().height;
    resizeObserver.observe(eventElement);

    return () => {
      resizeObserver.disconnect();
    };
  });
</script>

<div
  bind:this={eventElement}
  class={`${colourClasses} relative size-full cursor-pointer overflow-hidden rounded-xs py-1 pl-2
         transition-all duration-200 ease-out before:absolute before:top-0 before:left-0
         before:h-full before:w-1 before:rounded-l-md before:content-[''] hover:-translate-x-[1px] hover:-translate-y-0.5
         hover:shadow-md`}
>
  <div class="flex min-w-0 flex-col">
    {#if showTime}
      <span class="text-[0.6rem] font-medium">
        {startTime} - {endTime}
      </span>
    {/if}

    <span class="mt-0.5 truncate text-base font-bold">
      {calendarEvent.location}
    </span>
  </div>

  {#if showBooker}
    <div class="mt-0.5 flex items-center justify-center gap-1">
      <Avatar.Root class="size-3">
        <Avatar.Image
          class="border-0"
          src={bookingEvent.bookerAvatarUrl ?? ""}
          alt={bookingEvent.bookerName ?? "Booker avatar"}
        />
        <Avatar.Fallback class="text-[0.4rem]">
          {bookingEvent.bookerInitials ?? "NN"}
        </Avatar.Fallback>
      </Avatar.Root>

      <span class="w-full truncate rounded text-xs font-medium text-nowrap">
        {bookingEvent.bookerName}
      </span>
    </div>
  {/if}
</div>
