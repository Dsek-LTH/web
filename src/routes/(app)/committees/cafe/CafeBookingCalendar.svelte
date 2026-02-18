<script lang="ts">
  import * as m from "$paraglide/messages";
  import dayjs from "dayjs";
  import weekYear from "dayjs/plugin/weekYear";
  import weekOfYear from "dayjs/plugin/weekOfYear";
  import { enhance } from "$app/forms";
  import { TimeSlot } from "@prisma/client";
  import type { Ciabatta, ShiftWithWorker } from "./+page.server";
  import Pagination from "$lib/components/Pagination.svelte";
  import { isAuthorized } from "$lib/utils/authorization";
  import apiNames from "$lib/utils/apiNames";
  import type { AuthUser } from "@zenstackhq/runtime";

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
    user,
    ciabattaOfTheWeek,
  }: {
    week: dayjs.Dayjs;
    shifts: ShiftWithWorker[];
    user: AuthUser;
    ciabattaOfTheWeek: Ciabatta;
  } = $props();
  const now = dayjs();
  const windowStartWeek = now.week();
  const weeksInYear = dayjs(`$windowYear-12-31`).week();
  const isDayManager = isAuthorized(apiNames.CAFE.DAY_MANAGER, user);
  const canEditWorkers = isAuthorized(apiNames.CAFE.EDIT_WORKERS, user);

  function hasShift(day: dayjs.Dayjs, timeSlot: TimeSlot, user: AuthUser) {
    return shifts.find(
      (s) =>
        dayjs(s.date).isSame(day, "day") &&
        s.timeSlot == timeSlot &&
        s.worker.studentId == user.studentId,
    )
      ? true
      : false;
  }

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
  <div
    class="flex flex-col flex-wrap gap-2 overflow-x-auto pl-3 pr-3 pt-3 align-middle"
  >
    <p class="pl-3 text-4xl font-bold leading-snug text-primary">
      {m.booking_week()}
      {week.week()}
    </p>
    <article class="pl-3">
      <h2 class="text-xl font-bold text-primary">
        {m.cafe_ciabatta()}
      </h2>
      <h2 class="text-xl font-bold">
        {ciabattaOfTheWeek || m.errors_notImplemented()}
      </h2>
    </article>
    <Pagination
      class="pl-1 pr-1"
      count={canEditWorkers ? 52 : 3}
      fieldName="week"
      getPageName={(index) => {
        const week = canEditWorkers ? index + 1 : windowStartWeek + index;
        return week > weeksInYear
          ? (week - weeksInYear).toString()
          : week.toString();
      }}
      getPageNumber={(weekString) => {
        const week = Number(weekString);

        // map absolute week → window index
        let index = canEditWorkers ? week - 1 : week - windowStartWeek;
        if (index < 0) index += weeksInYear;

        return index;
      }}
      keepScrollPosition={true}
    />
  </div>
  <div class="mt-1 grid grid-cols-1 gap-3 p-3 md:grid-cols-5 md:gap-0">
    {#each weekDays as dayName}
      {@const day = week.startOf("week").add(weekDays.indexOf(dayName), "day")}
      {@const dayHasManager: boolean = shifts.find((s) => dayjs(s.date).isSame(day, "day") && s.timeSlot == "DAYMANAGER") != undefined}

      {#snippet DayForm(
        timeSlot: TimeSlot,
        disabled: boolean,
        user: AuthUser,
        checkForDayManager: boolean = true,
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
            class="border-1 m-1 w-full rounded border border-base-300 p-2 enabled:bg-base-300 enabled:hover:border-primary
            {dayHasManager ||
            !checkForDayManager ||
            hasShift(day, timeSlot, user)
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

        <p class="gap-1 text-center font-bold text-primary">Day Manager</p>
        {@render DayForm(
          TimeSlot.DAYMANAGER,
          !isDayManager && !hasShift(day, TimeSlot.DAYMANAGER, user),
          user,
          false,
        )}

        <hr class="mb-2 mt-2 border-base-content" />

        <!-- TODO: Rename all timeslots to just be indexes or similar to allow
                   for changing how many timeslots are before or after lunch -->
        <p
          class="gap-1 text-center font-medium {dayHasManager
            ? ''
            : 'text-slate-500'}"
        >
          kl 11-12
        </p>
        {@render DayForm(
          TimeSlot.SHIFT_1,
          !dayHasManager && !hasShift(day, TimeSlot.SHIFT_1, user),
          user,
        )}

        {@render DayForm(
          TimeSlot.SHIFT_2,
          !dayHasManager && !hasShift(day, TimeSlot.SHIFT_2, user),
          user,
        )}

        <hr class="mb-2 mt-2 border-base-content" />

        <p
          class="gap-1 text-center font-medium {dayHasManager
            ? ''
            : 'text-slate-500'}"
        >
          kl 12-13
        </p>
        {@render DayForm(
          TimeSlot.SHIFT_3,
          !dayHasManager && !hasShift(day, TimeSlot.SHIFT_3, user),
          user,
        )}
      </div>
    {/each}
  </div>
</div>
