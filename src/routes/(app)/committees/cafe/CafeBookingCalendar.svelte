<script lang="ts">
  import * as m from "$paraglide/messages";
  import dayjs from "dayjs";
  import weekYear from "dayjs/plugin/weekYear";
  import weekOfYear from "dayjs/plugin/weekOfYear";
  import { enhance } from "$app/forms";
  import { TimeSlot } from "@prisma/client";
  import type { ShiftWithWorker } from "./+page.server";
  import Pagination from "$lib/components/Pagination.svelte";

  dayjs.extend(weekOfYear);
  dayjs.extend(weekYear);

  const weekDays = [
    m.monday(),
    m.tuesday(),
    m.wednesday(),
    m.thursday(),
    m.friday(),
  ];
  let {
    week = $bindable(),
    shifts,
  }: { week: dayjs.Dayjs; shifts: ShiftWithWorker[] } = $props();

  const now = dayjs();

  const windowStartWeek = now.week();
  const windowYear = now.weekYear();
  const weeksInYear = dayjs(`${windowYear}-12-31`).week();
</script>

<!-- The bg-zinc here is very ugly, but I couldn't find better fitting colours...-->
<div
  class="i-mdi-border-radius:25px relative col-span-2 m-2 grid gap-2 rounded-lg border border-primary bg-zinc-300 p-2 dark:bg-zinc-800"
>
  <div class="flex flex-wrap gap-2 pl-3 pt-3 align-middle text-primary">
    <p class="pl-3 text-4xl font-bold leading-snug">
      {m.booking_week()}
      {week.week()}
    </p>
    <Pagination
      count={3}
      fieldName="week"
      getPageName={(index) => {
        const week = windowStartWeek + index;
        return week > weeksInYear
          ? (week - weeksInYear).toString()
          : week.toString();
      }}
      getPageNumber={(weekString) => {
        const week = Number(weekString);

        // map absolute week → window index
        let index = week - windowStartWeek;
        if (index < 0) index += weeksInYear;

        return index;
      }}
      keepScrollPosition={true}
    />
  </div>
  <div class="mt-1 grid grid-cols-1 gap-3 p-3 md:grid-cols-5 md:gap-0">
    {#each weekDays as day}
      {#snippet DayForm(timeSlot: TimeSlot, disabled: boolean)}
        <form
          method="POST"
          action="?/updateSchedule"
          class="flex w-full"
          use:enhance
        >
          <input
            type="hidden"
            name="date"
            value={week.startOf("week").add(weekDays.indexOf(day), "day")}
          />
          <input type="hidden" name="timeSlot" value={timeSlot} />
          <button
            class="border-1 m-1 w-full rounded border border-base-300 bg-base-300 p-2 enabled:hover:border-primary"
            {disabled}
          >
            {shifts.find(
              (s) =>
                dayjs(s.date).isSame(
                  week.startOf("week").add(weekDays.indexOf(day), "day"),
                  "day",
                ) && s.timeSlot == timeSlot,
            )?.worker.studentId || "-----"}
          </button>
        </form>
      {/snippet}

      <div class="m-1 grid rounded bg-base-200 p-2">
        <p class="gap-1 text-center font-medium">{day}</p>

        <p class="gap-1 text-center font-bold text-primary">Dagis</p>
        {@render DayForm(
          TimeSlot.DAGIS,
          // TODO: Make this check for if you're DAGIS with "some api somewhere" - Felix
          true,
        )}

        <hr class="mb-2 mt-2 border-base-content" />

        <p class="gap-1 text-center font-medium">kl 11-12</p>
        {@render DayForm(TimeSlot.EARLY_1, false)}

        {@render DayForm(TimeSlot.EARLY_2, false)}

        <hr class="mb-2 mt-2 border-base-content" />

        <p class="gap-1 text-center font-medium">kl 12-13</p>
        {@render DayForm(TimeSlot.LATE, false)}
      </div>
    {/each}
  </div>
</div>
