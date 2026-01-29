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
    isDagis,
  }: {
    week: dayjs.Dayjs;
    shifts: ShiftWithWorker[];
    isDagis: boolean;
  } = $props();

  const now = dayjs();

  const windowStartWeek = now.week();
  const windowYear = now.weekYear();
  const weeksInYear = dayjs(`${windowYear}-12-31`).week();

  function getName(day: dayjs.Dayjs, timeSlot: TimeSlot) {
    let shift = shifts.find(
      (s) => dayjs(s.date).isSame(day, "day") && s.timeSlot == timeSlot,
    );
    if (shift) {
      return shift.worker.firstName + " " + shift.worker.lastName;
    } else {
      return "-----";
    }
  }
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
    {#each weekDays as dayName}
      {@const day = week.startOf("week").add(weekDays.indexOf(dayName), "day")}
      {@const hasDagis: boolean = shifts.find((s) => dayjs(s.date).isSame(day, "day") && s.timeSlot == TimeSlot.DAGIS) != undefined}

      {#snippet DayForm(
        timeSlot: TimeSlot,
        disabled: boolean,
        checkForDagis: boolean = true,
      )}
        <form
          method="POST"
          action="?/updateSchedule"
          class="flex w-full"
          use:enhance
        >
          <input type="hidden" name="date" value={day} />
          <input type="hidden" name="timeSlot" value={timeSlot} />
          <button
            class="border-1 m-1 w-full rounded border border-base-300 p-2 enabled:bg-base-300 enabled:hover:border-primary {hasDagis ||
            !checkForDagis
              ? ''
              : 'text-slate-500'}"
            {disabled}
          >
            {getName(day, timeSlot)}
          </button>
        </form>
      {/snippet}

      <div class="m-1 grid rounded bg-base-200 p-2">
        <p class="gap-1 text-center font-medium">{dayName}</p>

        <p class="gap-1 text-center font-bold text-primary">Dagis</p>
        {@render DayForm(
          TimeSlot.DAGIS,
          // TODO: Make this check for if you're DAGIS with "some api somewhere" - Felix
          !isDagis,
          false,
        )}

        <hr class="mb-2 mt-2 border-base-content" />

        <!-- TODO: Rename all timeslots to just be indexes or similar to allow
                   for changing how many timeslots are before or after lunch -->
        <p
          class="gap-1 text-center font-medium {hasDagis
            ? ''
            : 'text-slate-500'}"
        >
          kl 11-12
        </p>
        {@render DayForm(TimeSlot.EARLY_1, !hasDagis)}

        {@render DayForm(TimeSlot.EARLY_2, !hasDagis)}

        <hr class="mb-2 mt-2 border-base-content" />

        <p
          class="gap-1 text-center font-medium {hasDagis
            ? ''
            : 'text-slate-500'}"
        >
          kl 12-13
        </p>
        {@render DayForm(TimeSlot.LATE, !hasDagis)}
      </div>
    {/each}
  </div>
</div>
