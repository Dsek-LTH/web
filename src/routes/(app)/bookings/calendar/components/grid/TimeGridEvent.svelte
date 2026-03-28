<script lang="ts">
  import * as Avatar from "$lib/components/ui/avatar";
  import type { CalendarEventExternal } from "@schedule-x/calendar";
  import { getTime } from "../../utils";
  import {
    calendarStatusCategoriesTailwind,
    type CalendarStatusCategory,
  } from "../../config";

  const { calendarEvent }: { calendarEvent: CalendarEventExternal } = $props();

  const startTime = $derived(getTime(calendarEvent.start));
  const endTime = $derived(getTime(calendarEvent.end));

  const category = $derived(
    calendarStatusCategoriesTailwind[
      calendarEvent.calendarId as CalendarStatusCategory
    ] ?? calendarStatusCategoriesTailwind.pending,
  );
  const colours = $derived(category.darkColors ?? category.lightColors);
  const colourClasses = $derived(Object.values(colours ?? {}).join(" "));
</script>

<div
  class={`${colourClasses} relative size-full cursor-pointer overflow-hidden rounded-xs py-1 pl-2
         transition-all duration-200 ease-out before:absolute before:top-0 before:left-0
         before:h-full before:w-1 before:rounded-l-md before:content-[''] hover:-translate-x-[1px] hover:-translate-y-0.5
         hover:shadow-md`}
>
  <div class="flex min-w-0 flex-col">
    <span class="text-[0.6rem] font-medium">
      {startTime} - {endTime}
    </span>

    <span class="mt-0.5 truncate text-base font-bold">
      {calendarEvent.location}
    </span>
  </div>

  <div class="mt-0.5 flex items-center justify-center gap-1">
    <Avatar.Root class="size-3">
      <Avatar.Image
        class="border-0"
        src="https://github.com/shadcn.png"
        alt="@shadcn"
      />
      <Avatar.Fallback class="text-[0.5rem]">CN</Avatar.Fallback>
    </Avatar.Root>

    <span class="w-full truncate rounded text-xs font-medium text-nowrap">
      {calendarEvent.people}
    </span>
  </div>
</div>
