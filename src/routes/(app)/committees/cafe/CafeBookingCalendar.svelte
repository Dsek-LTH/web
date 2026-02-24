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

  function canSignUpForShift(
    day: dayjs.Dayjs,
    timeSlot: TimeSlot,
    user: AuthUser,
  ) {
    let w = shifts.find(
      (s) => dayjs(s.date).isSame(day, "day") && s.timeSlot === timeSlot,
    )?.worker;
    if (!w) {
      return true;
    }
    if (w.studentId === user.studentId) {
      return true;
    } else {
      return false;
    }
  }

  function hasShift(day: dayjs.Dayjs, timeSlot: TimeSlot, user: AuthUser) {
    return shifts.find(
      (s) =>
        dayjs(s.date).isSame(day, "day") &&
        s.timeSlot === timeSlot &&
        s.worker.studentId === user.studentId,
    )
      ? true
      : false;
  }

  function getName(day: dayjs.Dayjs, timeSlot: TimeSlot) {
    let shift = shifts.find(
      (s) => dayjs(s.date).isSame(day, "day") && s.timeSlot === timeSlot,
    );
    if (shift) {
      return shift.worker.firstName + " " + shift.worker.lastName;
    } else {
      return "-----";
    }
  }

  function getStilId(day: dayjs.Dayjs, timeSlot: TimeSlot) {
    let shift = shifts.find(
      (s) => dayjs(s.date).isSame(day, "day") && s.timeSlot === timeSlot,
    );
    return shift?.worker.studentId ?? "";
  }

  function toggleEdit() {
    editing = !editing;
    if (!editing) {
      ciabattaString = ciabattaOfTheWeek?.ciabatta ?? m.errors_notImplemented();
    }
  }

  const now = dayjs();
  const windowStartWeek = now.week();
  const year = now.year();
  const weeksInYear = dayjs(`$windowYear-12-31`).week();
  const isDayManager = isAuthorized(apiNames.CAFE.DAY_MANAGER, user);
  const canEditWorkers = isAuthorized(apiNames.CAFE.EDIT_WORKERS, user);
  const canEditCiabattas = isAuthorized(apiNames.CAFE.EDIT_CIABATTAS, user);

  let editing: boolean = $state(false);

  let ciabattaString = $derived(
    ciabattaOfTheWeek?.ciabatta ?? m.errors_notImplemented(),
  );
</script>

<!-- The bg-zinc here is very ugly, but I couldn't find better fitting colours...-->
<div
  class="i-mdi-border-radius:25px relative col-span-2 m-2 grid gap-2 rounded-lg border border-primary bg-zinc-300 p-2 dark:bg-zinc-800"
>
  <div
    class="flex flex-row flex-wrap gap-2 overflow-x-auto pl-3 pr-3 pt-3 align-middle"
  >
    <div class="flex w-full flex-col">
      <div class="flex w-full flex-row items-center">
        <p class="pl-3 text-4xl font-bold text-primary">
          {m.booking_week()}
          {week.week()}
        </p>
        {#if canEditCiabattas || canEditWorkers}
          <button class="btn btn-secondary btn-sm ml-auto" onclick={toggleEdit}>
            {editing ? m.committees_stopEditing() : m.committees_edit()}</button
          >
        {/if}
      </div>
      <article class="pl-3">
        <h2 class="text-xl font-bold text-primary">
          {m.cafe_ciabatta()}
        </h2>
        {#if canEditCiabattas && editing}
          <form
            class="flex w-full gap-3 text-xl font-bold"
            action="?/editWeeklyCiabatta"
            method="POST"
            use:enhance={() => {
              return ({ update }) => update({ reset: false });
            }}
          >
            <input
              name="ciabatta"
              class="w-full min-w-0 flex-1 rounded border px-2"
              bind:value={ciabattaString}
              type="text"
            />
            <input hidden type="number" name="year" value={year} />
            <input hidden type="number" name="week" value={week.week()} />
            <button
              type="submit"
              class="btn btn-primary btn-sm pl-3"
              aria-label="submit new ciabatta name"
            >
              {m.committees_save()}
            </button>
          </form>
        {:else}
          <h2 class="text-xl font-bold">
            {ciabattaString}
          </h2>
        {/if}
      </article>
    </div>
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
      {@const dayHasManager: boolean = shifts.find((s) => dayjs(s.date).isSame(day, "day") && s.timeSlot === "DAYMANAGER") != undefined}

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
          {#if canEditWorkers && editing}
            <input
              name="worker"
              class="border-1 m-1 w-full rounded border p-2 text-center"
              value={getStilId(day, timeSlot)}
              type="text"
            />
          {:else}
            <button
              class="border-1 m-1 w-full rounded border border-base-300 p-2 enabled:bg-base-300 enabled:hover:border-primary
              {dayHasManager ||
              !checkForDayManager ||
              canSignUpForShift(day, timeSlot, user)
                ? ''
                : 'text-slate-500'}"
              {disabled}
            >
              {getName(day, timeSlot)}
            </button>
          {/if}
        </form>
      {/snippet}

      <div class="m-1 grid rounded bg-base-200 p-2">
        <p class="gap-1 text-center font-medium">{dayName}</p>

        <p class="gap-1 text-center font-bold text-primary">Day Manager</p>
        {@render DayForm(
          TimeSlot.DAYMANAGER,
          !canEditWorkers &&
            !(isDayManager && canSignUpForShift(day, TimeSlot.SHIFT_2, user)) &&
            !hasShift(day, TimeSlot.SHIFT_1, user),
          user,
          false,
        )}

        <hr class="mb-2 mt-2 border-base-content" />

        <p
          class="gap-1 text-center font-medium {dayHasManager
            ? ''
            : 'text-slate-500'}"
        >
          kl 11-12
        </p>
        {@render DayForm(
          TimeSlot.SHIFT_1,
          !(dayHasManager && canSignUpForShift(day, TimeSlot.SHIFT_1, user)) &&
            !hasShift(day, TimeSlot.SHIFT_1, user),
          user,
        )}

        {@render DayForm(
          TimeSlot.SHIFT_2,
          !(dayHasManager && canSignUpForShift(day, TimeSlot.SHIFT_2, user)) &&
            !hasShift(day, TimeSlot.SHIFT_2, user),
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
          !(dayHasManager && canSignUpForShift(day, TimeSlot.SHIFT_3, user)) &&
            !hasShift(day, TimeSlot.SHIFT_3, user),
          user,
        )}
      </div>
    {/each}
  </div>
</div>
