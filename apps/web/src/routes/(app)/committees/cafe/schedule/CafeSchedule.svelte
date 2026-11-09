<script lang="ts">
  import { page } from "$app/state";
  import { enhance } from "$app/forms";
  import { goto } from "$app/navigation";
  import { SvelteURLSearchParams } from "svelte/reactivity";
  import type { AuthUser } from "$lib/auth/types";
  import type { components } from "$lib/api/schema";
  import type { MemberSearchReturnAttributes } from "$lib/search/searchTypes";
  import { cn } from "$lib/utils";
  import apiNames from "$lib/utils/apiNames";
  import { getFullName } from "$lib/utils/client/member";

  import dayjs from "dayjs";
  import isoWeek from "dayjs/plugin/isoWeek";
  import isoWeeksInYear from "dayjs/plugin/isoWeeksInYear";
  import isLeapYear from "dayjs/plugin/isLeapYear";
  import localeData from "dayjs/plugin/localeData";

  import ChevronLeft from "@lucide/svelte/icons/chevron-left";
  import ChevronRight from "@lucide/svelte/icons/chevron-right";
  import Pen from "@lucide/svelte/icons/pen";
  import Sandwich from "@lucide/svelte/icons/sandwich";
  import UserPlus from "@lucide/svelte/icons/user-plus";

  import { Button, buttonVariants } from "$lib/components/ui/button";
  import * as Card from "$lib/components/ui/card";
  import * as Dialog from "$lib/components/ui/dialog";
  import { Input } from "$lib/components/ui/input";
  import * as Select from "$lib/components/ui/select";
  import * as Tooltip from "$lib/components/ui/tooltip";
  import MemberSelector from "$lib/components/MemberSelector.svelte";

  import { TimeSlot, type Ciabatta, type ShiftWithWorker } from "../types";

  import * as m from "$paraglide/messages";

  dayjs.extend(isoWeek);
  dayjs.extend(isoWeeksInYear);
  dayjs.extend(isLeapYear);
  dayjs.extend(localeData);

  const weekdays = dayjs.weekdays();

  let {
    week,
    shifts,
    user,
    ciabattaOfTheWeek,
  }: {
    /** Any day in the ISO week shown (the page passes its Monday). */
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
    if (!page.data.user?.memberId) {
      return false;
    }
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

  function getName(day: dayjs.Dayjs, timeSlot: TimeSlot) {
    let shift = shifts.find(
      (s) => dayjs(s.date).isSame(day, "day") && s.timeSlot === timeSlot,
    );
    if (shift) {
      return shift.worker.firstName + " " + shift.worker.lastName;
    } else {
      return undefined;
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
      ciabattaString = ciabattaOfTheWeek?.name ?? "";
    }
  }

  function getKey(day: dayjs.Dayjs, timeSlot: TimeSlot) {
    return `${day.format("YYYY-MM-DD")}-${timeSlot}`;
  }

  // Weeks are ISO weeks, like Go's GET /cafe/schedule: Monday-start, and a
  // week belongs to the ISO year of its Thursday (early January can be week
  // 52/53 of the previous year).
  const now = dayjs();
  const weekNumber = $derived(week.isoWeek());
  const weekYear = $derived(week.isoWeekYear());
  const weekKey = (d: dayjs.Dayjs) => `${d.isoWeekYear()}-${d.isoWeek()}`;
  const isDayManager = $derived(
    !!user?.policies.includes(apiNames.CAFE.DAY_MANAGER),
  );
  const canEditWorkers = $derived(
    !!user?.policies.includes(apiNames.CAFE.EDIT_WORKERS),
  );
  const canEditCiabattas = $derived(
    !!user?.policies.includes(apiNames.CAFE.EDIT_CIABATTAS),
  );
  const canSeeAllWeeks = $derived(
    !!user?.policies.includes(apiNames.CAFE.SEE_ALL_WEEKS),
  );

  let editing: boolean = $state(false);

  // The shape MemberSelector works with.
  type Member = Omit<MemberSearchReturnAttributes, "fullName"> & {
    id?: string;
  };
  const toSelectorMember = (
    worker: components["schemas"]["Member"],
  ): Member => ({
    id: worker.id,
    firstName: worker.firstName,
    lastName: worker.lastName,
    nickname: worker.nickname,
    studentId: worker.studentId,
    picturePath: worker.picturePath,
    classYear: worker.classYear,
    classProgramme: worker.classProgramme,
  });

  let memberMap: Record<string, Member | undefined> = $state({});

  $effect(() => {
    const newMap: Record<string, Member | undefined> = {};
    for (const shift of shifts) {
      newMap[getKey(dayjs(shift.date), shift.timeSlot as TimeSlot)] =
        toSelectorMember(shift.worker);
    }
    memberMap = newMap;
  });

  let ciabattaString = $derived(ciabattaOfTheWeek?.name ?? "");

  // The weeks the selector offers: every week of the shown ISO year, or
  // (without cafe:see_all_weeks) the current week and the two after it,
  // which Go also enforces.
  let weeks = $derived.by(() => {
    if (canSeeAllWeeks) {
      const monday = week.startOf("isoWeek");
      const weeksInYear = monday.add(3, "day").isoWeeksInYear();
      const firstMonday = monday.subtract(weekNumber - 1, "week");
      return Array.from({ length: weeksInYear }, (_, i) =>
        firstMonday.add(i, "week"),
      );
    }
    const monday = now.startOf("isoWeek");
    return [0, 1, 2].map((i) => monday.add(i, "week"));
  });
  const prevWeek = $derived(week.subtract(1, "week"));
  const nextWeek = $derived(week.add(1, "week"));
  const canGoTo = (d: dayjs.Dayjs) =>
    canSeeAllWeeks || weeks.some((w) => weekKey(w) === weekKey(d));

  function goToWeek(d: dayjs.Dayjs) {
    if (canGoTo(d)) {
      const searchParams = new SvelteURLSearchParams(page.url.searchParams);
      searchParams.set("year", d.isoWeekYear().toString());
      searchParams.set("week", d.isoWeek().toString());
      // eslint-disable-next-line svelte/no-navigation-without-resolve -- Navigation uses relative search params
      goto(`?${searchParams.toString()}`, {
        keepFocus: true,
        noScroll: true,
        replaceState: true,
      });
    }
  }

  function handleWeekChange(value: string) {
    const target = weeks.find((w) => weekKey(w) === value);
    if (target) goToWeek(target);
  }
  const formRefs: Record<string, HTMLFormElement> = $state({});
</script>

<Card.Root>
  <div class=" border-primary relative col-span-2 grid gap-2 rounded-lg px-4">
    <div class="flex flex-row flex-wrap gap-2 overflow-x-auto align-middle">
      <div class="flex w-full flex-col">
        <div class="flex w-full flex-row items-center">
          <h3>{m.cafe_worker_schedule()}</h3>
          {#if canEditCiabattas}
            <Button
              variant="lila"
              size="sm"
              class="ml-auto"
              onclick={toggleEdit}
              ><Sandwich />
              {editing
                ? m.committees_stopEditing()
                : m.cafe_edit_ciabatta()}</Button
            >
          {/if}
        </div>
        <article>
          <h5 class="flex flex-row gap-1">
            {m.cafe_ciabatta()}
            {#if canEditCiabattas && editing}
              <form
                class="flex w-full gap-3"
                action="?/editWeeklyCiabatta"
                method="POST"
                use:enhance={() => {
                  toggleEdit();
                  return ({ update }) => update({ reset: false });
                }}
              >
                <Input
                  name="name"
                  class="w-full min-w-0 flex-1"
                  bind:value={ciabattaString}
                  type="text"
                />
                <input hidden type="number" name="year" value={weekYear} />
                <input hidden type="number" name="week" value={weekNumber} />
                <Button
                  type="submit"
                  size="sm"
                  aria-label="submit new ciabatta name"
                >
                  {m.committees_save()}
                </Button>
              </form>
            {:else}
              <span>
                {ciabattaString}
              </span>
            {/if}
          </h5>
        </article>
      </div>
      <div class="flex w-full flex-row flex-wrap justify-between">
        <!-- NOTE: The amount of weeks you can see when logged in is checked server-side in the page.server.ts file in the getWeek function -->
        {@render WeekSelector()}
        {#if canEditWorkers}
          {@render EditModal()}
        {/if}
      </div>
    </div>
    <div class=" grid grid-cols-1 gap-2 md:grid-cols-5">
      {#each { length: 5 }, dayIndex}
        {@const day = week.startOf("isoWeek").add(dayIndex, "day")}
        {@const dayHasManager: boolean = shifts.find((s) => dayjs(s.date).isSame(day, "day") && s.timeSlot === "DAYMANAGER") != undefined}
        {#snippet DayForm(timeSlot: TimeSlot, disabled: boolean)}
          <form
            method="POST"
            action="?/updateSchedule"
            class="flex w-full overflow-hidden overflow-ellipsis"
            use:enhance={() =>
              ({ update }) =>
                update({ reset: false })}
          >
            <input type="hidden" name="date" value={day.format("YYYY-MM-DD")} />
            <input type="hidden" name="timeSlot" value={timeSlot} />

            <input
              name="worker"
              value={getStilId(day, timeSlot)}
              type="text"
              hidden
            />{#if getName(day, timeSlot)}
              <Tooltip.Root>
                <Tooltip.Trigger
                  type={disabled ? "button" : "submit"}
                  class={cn(
                    buttonVariants({ variant: "outline" }),
                    "block w-full overflow-hidden overflow-ellipsis",
                    disabled ? "hover:bg-unset pointer-events-auto!" : "",
                  )}
                  aria-disabled={disabled}
                  disabled={false}>{getName(day, timeSlot)}</Tooltip.Trigger
                >
                <Tooltip.Content>
                  {getName(day, timeSlot)}
                </Tooltip.Content>
              </Tooltip.Root>
            {:else}
              <Button
                variant="outline"
                type="submit"
                class="text-muted-foreground flex w-full overflow-hidden {disabled
                  ? 'border-[1px]'
                  : 'border-dashed'} overflow-ellipsis"
                {disabled}
                >{#if !disabled}<UserPlus /> {m.cafe_signup()}{/if}</Button
              >
            {/if}
          </form>
        {/snippet}

        {#snippet DayWorkerForm(timeSlot: TimeSlot)}
          {@render DayForm(
            timeSlot,
            !(dayHasManager && canSignUpForShift(day, timeSlot, user)) &&
              !hasShift(day, timeSlot, user) &&
              !canEditWorkers,
          )}
        {/snippet}

        <div class="grid w-full gap-1">
          <h6 class="text-primary text-center">
            {weekdays[dayIndex + 1]}
          </h6>

          <p class="gap-1 text-center font-bold">{m.cafe_day_manager()}</p>
          {@render DayForm(
            TimeSlot.DAYMANAGER,
            !canEditWorkers &&
              !(
                isDayManager &&
                canSignUpForShift(day, TimeSlot.DAYMANAGER, user)
              ) &&
              !hasShift(day, TimeSlot.DAYMANAGER, user),
          )}

          <hr class="border-muted-background mt-2 mb-2" />

          <p class="gap-1 text-center font-medium">11:00 - 12:00</p>
          {@render DayWorkerForm(TimeSlot.SHIFT_1)}

          {@render DayWorkerForm(TimeSlot.SHIFT_2)}

          <hr class="border-muted-background mt-2 mb-2" />

          <p class="gap-1 text-center font-medium">12:00 - 13:00</p>
          {@render DayWorkerForm(TimeSlot.SHIFT_3)}
        </div>
      {/each}
    </div>
  </div>
</Card.Root>

{#snippet EditModal()}
  <Dialog.Root>
    <Dialog.Trigger class={buttonVariants({ variant: "rosa" })}
      ><Pen /> {m.cafe_edit_schedule()}</Dialog.Trigger
    >
    <Dialog.Content
      class="top-[47vh] z-51 flex max-h-[90vh] max-w-[98vw]! flex-col xl:max-w-[80vw]!"
    >
      <Dialog.Header>
        <h4 class="flex flex-row items-center gap-2">
          {m.cafe_editing_schedule()}
          {@render WeekSelector()}
        </h4>
      </Dialog.Header>

      <div
        class="grid h-full min-h-0 grid-cols-1 overflow-y-auto px-4 md:grid-cols-5"
      >
        {#each { length: 5 }, dayIndex}
          {@const day = week.startOf("isoWeek").add(dayIndex, "day")}
          {#snippet DayForm(timeSlot: TimeSlot)}
            <form
              method="POST"
              action="?/updateSchedule"
              onerror={(e) => console.log(e)}
              bind:this={formRefs[getKey(day, timeSlot)]}
              class="flex h-14 w-full overflow-ellipsis"
              use:enhance={() =>
                ({ update }) =>
                  update({ reset: false })}
            >
              <input
                type="hidden"
                name="date"
                value={day.format("YYYY-MM-DD")}
              />
              <input type="hidden" name="timeSlot" value={timeSlot} />

              <div class="flex w-full flex-col *:w-full">
                <MemberSelector
                  multiple={false}
                  showNickname={false}
                  showId={false}
                  showClass={false}
                  onchange={async () => {
                    setTimeout(
                      // The delay is needed, otherwise the worker input doesn't get updated in time
                      () => formRefs[getKey(day, timeSlot)]?.requestSubmit(),
                      100,
                    );
                  }}
                  onremove={async () => {
                    // No delay here, since we want to submit the worker id, not an empty string
                    formRefs[getKey(day, timeSlot)]?.requestSubmit();
                  }}
                  bind:selectedMembers={
                    () => {
                      const member = memberMap[getKey(day, timeSlot)];

                      if (!member) return [];
                      return [{ ...member, fullName: getFullName(member) }];
                    },
                    (value) => {
                      const key = getKey(day, timeSlot);
                      memberMap[key] = value?.[0] ?? undefined;
                    }
                  }
                  class="w-full"
                />
                <input
                  name="worker"
                  hidden
                  value={memberMap[getKey(day, timeSlot)]?.studentId ?? ""}
                />
                <button aria-label="Submit changed worker" hidden type="submit">
                  {m.save()}
                </button>
              </div>
            </form>
          {/snippet}

          {#snippet DayWorkerForm(timeSlot: TimeSlot)}
            {@render DayForm(timeSlot)}
          {/snippet}

          <div class="grid w-full gap-1 border-r-[1px] px-2 last:border-r-0!">
            <h6 class="text-primary text-center">
              {weekdays[dayIndex + 1]}
            </h6>

            <p class="gap-1 text-center font-bold">{m.cafe_day_manager()}</p>
            {@render DayForm(TimeSlot.DAYMANAGER)}

            <hr class="border-muted-background mt-2 mb-2" />

            <p class="gap-1 text-center font-medium">11:00 - 12:00</p>
            {@render DayWorkerForm(TimeSlot.SHIFT_1)}

            {@render DayWorkerForm(TimeSlot.SHIFT_2)}

            <hr class="border-muted-background mt-2 mb-2" />

            <p class="gap-1 text-center font-medium">12:00 - 13:00</p>
            {@render DayWorkerForm(TimeSlot.SHIFT_3)}
          </div>
        {/each}
      </div>
      <Dialog.Footer class="mt-4 w-full px-4 py-2">
        <Dialog.Close
          type="button"
          class={buttonVariants({ variant: "outline" })}
          >{m.close()}</Dialog.Close
        >
      </Dialog.Footer>
    </Dialog.Content>
  </Dialog.Root>{/snippet}

{#snippet WeekSelector()}
  <div class="inline-flex items-center gap-1">
    <Button
      variant="outline"
      disabled={!canGoTo(prevWeek)}
      size="icon"
      onclick={() => goToWeek(prevWeek)}
      class="size-9 shrink-0"
    >
      <!-- size-9 is same height as Select.Trigger with size="default" -->
      <ChevronLeft class="size-4" />
    </Button>

    <Select.Root
      type="single"
      value={weekKey(week)}
      onValueChange={handleWeekChange}
    >
      <Select.Trigger class="w-[120px]" size="default">
        {m.booking_week()}
        {weekNumber}
      </Select.Trigger>
      <Select.Content class="max-h-[300px]">
        <Select.ScrollUpButton />
        <Select.Group>
          {#each weeks as w (weekKey(w))}
            <Select.Item value={weekKey(w)}
              >{m.booking_week()} {w.isoWeek()}</Select.Item
            >
          {/each}
        </Select.Group>
        <Select.ScrollDownButton />
      </Select.Content>
    </Select.Root>

    <Button
      variant="outline"
      size="icon"
      disabled={!canGoTo(nextWeek)}
      class="size-9 shrink-0"
      onclick={() => goToWeek(nextWeek)}
    >
      <ChevronRight class="size-4" />
    </Button>
  </div>
{/snippet}
