<script lang="ts">
  import * as m from "$paraglide/messages";
  import dayjs from "dayjs";
  import weekYear from "dayjs/plugin/weekYear";
  import weekOfYear from "dayjs/plugin/weekOfYear";
  import { enhance } from "$app/forms";
  import Pagination from "$lib/components/Pagination.svelte";
  import { isAuthorized } from "$lib/utils/authorization";
  import apiNames from "$lib/utils/apiNames";
  import type { AuthUser } from "@zenstackhq/runtime";
  import type { ExtendedPrismaModel } from "$lib/server/extendedPrisma";
  import MemberSearchInput from "$lib/components/forms/MemberSearchInput.svelte";
  import { tick } from "svelte";
  import type { ShiftWithWorker, Ciabatta } from "./types";
  import { TimeSlot } from "./types";
  import "dayjs/locale/en-gb";
  import { languageTag } from "$paraglide/runtime";

  dayjs.extend(weekOfYear);
  dayjs.extend(weekYear);

  const getWeekdayName = (weekday: number): string => {
    let locale: string;
    switch (languageTag()) {
      case "sv": {
        locale = "sv-SE";
        break;
      }
      case "en": {
        locale = "en-GB";
        break;
      }
      default: {
        locale = "sv-SE";
        break;
      }
    }
    if (weekday < 0 || weekday > 6) return "";

    // Reference Monday: Jan 5, 1970 was a Monday
    const referenceMonday = new Date(Date.UTC(1970, 0, 5 + weekday));
    return referenceMonday.toLocaleDateString(locale, { weekday: "long" });
  };

  let {
    week = $bindable(),
    shifts,
    user,
    ciabattaOfTheWeek,
  }: {
    week: dayjs.Dayjs;
    shifts: ShiftWithWorker[];
    user: AuthUser;
    ciabattaOfTheWeek: Ciabatta | null;
  } = $props();

  function canSignUpForShift(
    day: dayjs.Dayjs,
    timeSlot: TimeSlot,
    user: AuthUser,
  ) {
    let worker = shifts.find(
      (s) => dayjs(s.date).isSame(day, "day") && s.timeSlot === timeSlot,
    )?.worker;
    if (!worker) {
      return true;
    }
    return worker.studentId === user.studentId;
  }

  function hasShift(day: dayjs.Dayjs, timeSlot: TimeSlot, user: AuthUser) {
    return !!shifts.find(
      (s) =>
        dayjs(s.date).isSame(day, "day") &&
        s.timeSlot === timeSlot &&
        s.worker.studentId === user.studentId,
    );
  }

  function shiftExists(day: dayjs.Dayjs, timeSlot: TimeSlot) {
    return !!shifts.find(
      (shift) =>
        dayjs(shift.date).isSame(day, "day") && shift.timeSlot === timeSlot,
    );
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

  function getStilId(
    day: dayjs.Dayjs,
    timeSlot: TimeSlot,
  ): string | null | undefined {
    let shift = shifts.find(
      (s) => dayjs(s.date).isSame(day, "day") && s.timeSlot === timeSlot,
    );
    return shift?.worker.studentId;
  }

  function toggleEdit() {
    editing = !editing;
    if (!editing) {
      ciabattaString = ciabattaOfTheWeek?.name ?? m.errors_notImplemented();
    }
  }

  function getKey(day: dayjs.Dayjs, timeSlot: TimeSlot) {
    return `${day.format("YYYY-MM-DD")}-${timeSlot}`;
  }

  const now = dayjs();
  const windowStartWeek = now.week();
  const year = now.year();
  const weeksInYear = dayjs(`${year}-12-31`).week();
  const isDayManager = isAuthorized(apiNames.CAFE.DAY_MANAGER, user);
  const canEditWorkers = isAuthorized(apiNames.CAFE.EDIT_WORKERS, user);
  const canEditCiabattas = isAuthorized(apiNames.CAFE.EDIT_CIABATTAS, user);
  const canSeeAllWeeks = isAuthorized(apiNames.CAFE.SEE_ALL_WEEKS, user);

  let editing: boolean = $state(false);

  type Member = ExtendedPrismaModel<"Member">;

  let memberMap: Record<string, Member | undefined> = $state({});

  $effect(() => {
    const newMap: Record<string, Member | undefined> = {};
    for (const shift of shifts) {
      newMap[getKey(dayjs(shift.date), shift.timeSlot)] = shift.worker;
    }
    memberMap = newMap;
  });

  const formRefs: Record<string, HTMLFormElement> = {};

  let ciabattaString = $derived(
    ciabattaOfTheWeek?.name ?? m.errors_notImplemented(),
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
              name="name"
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
    <!-- NOTE: The amount of weeks you can see when logged in is checked server-side in the page.server.ts file in the getWeek function -->
    <Pagination
      class="pl-1 pr-1"
      count={canSeeAllWeeks ? 52 : 3}
      fieldName="week"
      getPageName={(index) => {
        const week = canSeeAllWeeks ? index + 1 : windowStartWeek + index;
        return (week % weeksInYear).toString();
      }}
      getPageNumber={(weekString) => {
        const week = Number(weekString);

        // Map absolute week -> window index.
        let index = canSeeAllWeeks ? week - 1 : week - windowStartWeek;
        if (index < 0) index += weeksInYear;

        return index;
      }}
      keepScrollPosition={true}
    />
  </div>
  <div class="mt-1 grid grid-cols-1 gap-3 p-3 md:grid-cols-5 md:gap-0">
    <!-- eslint-disable-next-line @typescript-eslint/no-unused-vars -- ESLint is missing functionality -->
    {#each { length: 5 } as _, dayIndex}
      <!-- {#each { length: 5}, dayIndex} -->
      <!-- TODO: Fix this when we update our eslint plugins by swapping
          to the commented out line -->
      {@const day = week.startOf("week").add(dayIndex, "day")}
      {@const dayHasManager: boolean = shifts.find((s) => dayjs(s.date).isSame(day, "day") && s.timeSlot === "DAYMANAGER") != undefined}
      {#snippet DayForm(
        timeSlot: TimeSlot,
        disabled: boolean,
        name_color_override: boolean = false,
      )}
        <form
          method="POST"
          action="?/updateSchedule"
          class="flex w-full"
          use:enhance={() =>
            ({ update }) =>
              update({ reset: false })}
        >
          <input type="hidden" name="date" value={day.format("YYYY-MM-DD")} />
          <input type="hidden" name="timeSlot" value={timeSlot} />
          {#if canEditWorkers && editing}
            <MemberSearchInput
              bind:member={memberMap[getKey(day, timeSlot)]}
              onSelect={async () => {
                await tick();
                formRefs[getKey(day, timeSlot)]?.requestSubmit();
              }}
              class="pb-1.5"
            />
            <input
              name="worker"
              hidden
              value={memberMap[getKey(day, timeSlot)]?.studentId ?? ""}
            />
          {:else}
            <input
              name="worker"
              value={getStilId(day, timeSlot)}
              type="text"
              hidden
            />
            <button
              class="border-1 m-1 w-full rounded p-2 enabled:bg-base-300 enabled:hover:border-primary
              {disabled && !name_color_override
                ? 'text-slate-500'
                : 'border border-base-300'}"
              {disabled}
            >
              {getName(day, timeSlot)}
            </button>
          {/if}
        </form>
      {/snippet}

      {#snippet DayWorkerForm(timeSlot: TimeSlot)}
        {@render DayForm(
          timeSlot,
          !(dayHasManager && canSignUpForShift(day, TimeSlot.SHIFT_1, user)) &&
            !hasShift(day, timeSlot, user) &&
            !canEditWorkers,
        )}
      {/snippet}

      <div class="m-1 grid rounded bg-base-200 p-2">
        <p class="gap-1 text-center font-medium text-primary">
          {getWeekdayName(dayIndex)}
        </p>

        <p class="gap-1 text-center font-bold">{m.cafe_day_manager()}</p>
        {@render DayForm(
          TimeSlot.DAYMANAGER,
          !canEditWorkers &&
            !(
              isDayManager && canSignUpForShift(day, TimeSlot.DAYMANAGER, user)
            ) &&
            !hasShift(day, TimeSlot.DAYMANAGER, user),
          shiftExists(day, TimeSlot.DAYMANAGER),
        )}

        <hr class="mb-2 mt-2 border-base-content" />

        <p
          class="gap-1 text-center font-medium {dayHasManager || canEditWorkers
            ? ''
            : 'text-slate-500'}"
        >
          11:00 - 12:00
        </p>
        {@render DayWorkerForm(TimeSlot.SHIFT_1)}

        {@render DayWorkerForm(TimeSlot.SHIFT_2)}

        <hr class="mb-2 mt-2 border-base-content" />

        <p
          class="gap-1 text-center font-medium {dayHasManager || canEditWorkers
            ? ''
            : 'text-slate-500'}"
        >
          12:00 - 13:00
        </p>
        {@render DayWorkerForm(TimeSlot.SHIFT_3)}
      </div>
    {/each}
  </div>
</div>
