<script lang="ts">
  import * as m from "$paraglide/messages";
  import dayjs from "dayjs";
  import weekYear from "dayjs/plugin/weekYear";
  import weekOfYear from "dayjs/plugin/weekOfYear";
  import { enhance } from "$app/forms";
  import { TimeSlot } from "@prisma/client";
  import type { ShiftWithWorker } from "./+page.server";

  dayjs.extend(weekOfYear);
  dayjs.extend(weekYear);

  // TODO: translate day strings
  const weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  let {
    week = $bindable(),
    shifts,
  }: { week: dayjs.Dayjs; shifts: ShiftWithWorker[] } = $props();

  async function handleSubmit(event: SubmitEvent, increment: boolean) {
    event.preventDefault();

    // Get the current URL
    const url = new URL(window.location.href);

    //BUG: This is all sorts of cursed around the new years, but is almost ok for a test version. Almost
    // TODO: fix this ^^^
    week = week.add(increment ? 1 : -1, "week");
    let diff = dayjs().diff(week, "week");
    let val = 0;
    if (!increment) {
      let val = 0 - Math.abs(diff);
    } else {
      let val = 0 + Math.abs(diff);
    }

    url.searchParams.set(
      "week",
      // week.add(increment, "week").diff(dayjs(), "week").toString(),
      val.toString(),
    );
    window.history.replaceState({}, "", url.toString());
    // window.location.href = url.toString();
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
    <form method="POST" onsubmit={(e) => handleSubmit(e, false)}>
      <input type="hidden" name="week" value={week.subtract(-1, "week")} />
      <button
        class="btn btn-square btn-neutral ml-5 h-fit"
        aria-label="go to previous week"
      >
        <!-- disabled={dayjs().subtract(1, "day").isAfter(week)} -->
        «
      </button>
    </form>
    <form method="POST" onsubmit={(e) => handleSubmit(e, true)}>
      <input type="hidden" name="week" value={week.add(1, "week")} />
      <button
        class="btn btn-square btn-neutral h-fit"
        aria-label="go to next week"
      >
        <!-- disabled={week.subtract(3, "day").isAfter(dayjs())} -->
        »
      </button>
    </form>
  </div>
  <div class="mt-1 grid grid-cols-1 gap-3 p-3 md:grid-cols-5 md:gap-0">
    {#each weekDays as day}
      <div class="m-1 grid rounded bg-base-200 p-2">
        <p class="flex gap-1 font-medium">{day}</p>
        <p class="flex gap-1 font-bold text-primary">Dagis:</p>
        <!-- TODO: Maybe move out this whole block into it's own component so we can re-use more code -->
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
          <input type="hidden" name="timeSlot" value={TimeSlot.DAGIS} />
          <button
            class=" border-1 m-1 w-full rounded border border-base-300 bg-base-300 p-2 enabled:hover:border-primary"
          >
            <!-- TODO: only disable if we aren't dagis -->
            <!-- TODO: check this with "some api somewhere" - Felix -->
            {shifts.find(
              (s) =>
                dayjs(s.date).isSame(
                  week.startOf("week").add(weekDays.indexOf(day), "day"),
                  "day",
                ) && s.timeSlot == TimeSlot.DAGIS,
            )?.worker.studentId || "-----"}
          </button>
        </form>
        <hr class="mb-2 mt-2 border-base-content" />
        <p class="flex gap-1 font-medium">kl 11-12</p>
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
          <input type="hidden" name="timeSlot" value={TimeSlot.EARLY_1} />
          <button
            class=" border-1 m-1 w-full rounded border border-base-300 bg-base-300 p-2 hover:border-primary"
          >
            <!-- TODO: Change formatting of name to something resaonable. Make a helper funciton somewhere. -->
            {shifts.find(
              (s) =>
                dayjs(s.date).isSame(
                  week.startOf("week").add(weekDays.indexOf(day), "day"),
                  "day",
                ) && s.timeSlot == TimeSlot.EARLY_1,
            )?.worker.studentId || "-----"}
          </button>
        </form>
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
          <input type="hidden" name="timeSlot" value={TimeSlot.EARLY_2} />
          <button
            class=" border-1 m-1 w-full rounded border border-base-300 bg-base-300 p-2 hover:border-primary"
          >
            {shifts.find(
              (s) =>
                dayjs(s.date).isSame(
                  week.startOf("week").add(weekDays.indexOf(day), "day"),
                  "day",
                ) && s.timeSlot == TimeSlot.EARLY_2,
            )?.worker.studentId || "-----"}
          </button>
        </form>
        <hr class="mb-2 mt-2 border-base-content" />
        <p class="flex gap-1 font-medium">kl 12-13</p>
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
          <input type="hidden" name="timeSlot" value={TimeSlot.LATE} />
          <button
            class=" border-1 m-1 w-full rounded border border-base-300 bg-base-300 p-2 hover:border-primary"
          >
            {shifts.find(
              (s) =>
                dayjs(s.date).isSame(
                  week.startOf("week").add(weekDays.indexOf(day), "day"),
                  "day",
                ) && s.timeSlot == TimeSlot.LATE,
            )?.worker.studentId || "-----"}
          </button>
        </form>
      </div>
    {/each}
  </div>
</div>
