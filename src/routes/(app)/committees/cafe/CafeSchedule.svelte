<script lang="ts">
  import * as m from "$paraglide/messages";
  import dayjs from "dayjs";
  import weekYear from "dayjs/plugin/weekYear";
  import weekOfYear from "dayjs/plugin/weekOfYear";
  import { enhance } from "$app/forms";
  import { isAuthorized } from "$lib/utils/authorization";
  import apiNames from "$lib/utils/apiNames";
  import type { AuthUser } from "@zenstackhq/runtime";
  import type { ExtendedPrismaModel } from "$lib/server/extendedPrisma";
  import MemberSelector from "$lib/components/MemberSelector.svelte";
  import type { ShiftWithWorker, Ciabatta } from "./types";
  import { TimeSlot } from "./types";
  import "dayjs/locale/en-gb";
  import { getLocale } from "$paraglide/runtime";
  import { page } from "$app/state";
  import { Button, buttonVariants } from "$lib/components/ui/button";
  import * as Select from "$lib/components/ui/select";
  import ChevronLeft from "@lucide/svelte/icons/chevron-left";
  import ChevronRight from "@lucide/svelte/icons/chevron-right";
  import Pen from "@lucide/svelte/icons/pen";
  import Sandwich from "@lucide/svelte/icons/sandwich";
  import { SvelteURLSearchParams } from "svelte/reactivity";
  import { goto } from "$app/navigation";
  import { getFullName } from "$lib/utils/client/member";
  import * as Card from "$lib/components/ui/card";
  import { Input } from "$lib/components/ui/input";
  import * as Tooltip from "$lib/components/ui/tooltip";
  import * as Dialog from "$lib/components/ui/dialog";
  import { cn } from "$lib/utils";
  import { UserPlus } from "@lucide/svelte";

  dayjs.extend(weekOfYear);
  dayjs.extend(weekYear);

  const getWeekdayName = (weekday: number): string => {
    let locale: string;
    switch (getLocale()) {
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
      ciabattaString = ciabattaOfTheWeek?.name ?? m.errors_notImplemented();
    }
  }

  function getKey(day: dayjs.Dayjs, timeSlot: TimeSlot) {
    return `${day.format("YYYY-MM-DD")}-${timeSlot}`;
  }

  const now = dayjs();
  const year = now.year();
  const weeksInYear = dayjs(`${year}-12-31`).week();
  const isDayManager = $derived(isAuthorized(apiNames.CAFE.DAY_MANAGER, user));
  const canEditWorkers = $derived(
    isAuthorized(apiNames.CAFE.EDIT_WORKERS, user),
  );
  const canEditCiabattas = $derived(
    isAuthorized(apiNames.CAFE.EDIT_CIABATTAS, user),
  );
  const canSeeAllWeeks = $derived(
    isAuthorized(apiNames.CAFE.SEE_ALL_WEEKS, user),
  );

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

  let ciabattaString = $derived(
    ciabattaOfTheWeek?.name ?? m.errors_notImplemented(),
  );

  let weeks = $derived(
    canSeeAllWeeks
      ? Array.from(Array(weeksInYear).keys())
      : [week.week() - 1, week.week(), week.week() + 1],
  );

  function handleWeekChange(value: string) {
    if (weeks.includes(Number(value))) {
      const searchParams = new SvelteURLSearchParams(page.url.searchParams);
      searchParams.set("week", value);
      // eslint-disable-next-line svelte/no-navigation-without-resolve -- Navigation uses relative search params
      goto(`?${searchParams.toString()}`, {
        keepFocus: true,
        noScroll: true,
        replaceState: true,
      });
    }
  }
  const formRefs: Record<string, HTMLFormElement> = $state({});
</script>

<!-- The bg-zinc here is very ugly, but I couldn't find better fitting colours...-->
<Card.Root>
  <div
    class="i-mdi-border-radius:25px border-primary relative col-span-2 grid gap-2 rounded-lg px-4"
  >
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
                  return ({ update }) => update({ reset: false });
                }}
              >
                <Input
                  name="name"
                  class="w-full min-w-0 flex-1"
                  bind:value={ciabattaString}
                  type="text"
                />
                <input hidden type="number" name="year" value={year} />
                <input hidden type="number" name="week" value={week.week()} />
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
                  type="submit"
                  class={cn(
                    buttonVariants({ variant: "outline" }),
                    "block w-full  overflow-hidden overflow-ellipsis",
                    disabled && !name_color_override
                      ? "text-slate-500"
                      : "border-base-300 border",
                  )}
                  {disabled}>{getName(day, timeSlot)}</Tooltip.Trigger
                >
                <Tooltip.Content>
                  {getName(day, timeSlot)}
                </Tooltip.Content>
              </Tooltip.Root>
            {:else}
              <Button
                variant="outline"
                type="submit"
                class="text-muted-foreground flex w-full overflow-hidden border-dashed overflow-ellipsis
              {disabled && !name_color_override
                  ? 'text-slate-500'
                  : 'border-base-300 border'}"
                {disabled}><UserPlus /> Ledigt</Button
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
            {getWeekdayName(dayIndex)}
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
            shiftExists(day, TimeSlot.DAYMANAGER),
          )}

          <hr class="border-base-content mt-2 mb-2" />

          <p
            class="gap-1 text-center font-medium {dayHasManager ||
            canEditWorkers
              ? ''
              : 'text-slate-500'}"
          >
            11:00 - 12:00
          </p>
          {@render DayWorkerForm(TimeSlot.SHIFT_1)}

          {@render DayWorkerForm(TimeSlot.SHIFT_2)}

          <hr class="border-base-content mt-2 mb-2" />

          <p
            class="gap-1 text-center font-medium {dayHasManager ||
            canEditWorkers
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
</Card.Root>

{#snippet EditModal()}
  <Dialog.Root>
    <Dialog.Trigger class={buttonVariants({ variant: "rosa" })}
      ><Pen /> {m.cafe_edit_schedule()}</Dialog.Trigger
    >
    <Dialog.Content class="z-51 max-w-[80vw]!">
      <Dialog.Header>
        <h4 class="flex flex-row items-center gap-2">
          {m.cafe_editing_schedule()}
          {@render WeekSelector()}
        </h4>
      </Dialog.Header>

      <div class="grid grid-cols-1 px-4 md:grid-cols-5">
        {#each { length: 5 }, dayIndex}
          {@const day = week.startOf("week").add(dayIndex, "day")}
          {@const dayHasManager: boolean = shifts.find((s) => dayjs(s.date).isSame(day, "day") && s.timeSlot === "DAYMANAGER") != undefined}
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
                  bind:selectedMembers={() => {
                    const member = memberMap[getKey(day, timeSlot)];

                    if (!member) return [];
                    return [{ ...member, fullName: getFullName(member) }];
                  },
                  (value) => {
                    const key = getKey(day, timeSlot);
                    memberMap[key] = value?.[0] ?? undefined;
                  }}
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
              {getWeekdayName(dayIndex)}
            </h6>

            <p class="gap-1 text-center font-bold">{m.cafe_day_manager()}</p>
            {@render DayForm(TimeSlot.DAYMANAGER)}

            <hr class="border-base-content mt-2 mb-2" />

            <p
              class="gap-1 text-center font-medium {dayHasManager ||
              canEditWorkers
                ? ''
                : 'text-slate-500'}"
            >
              11:00 - 12:00
            </p>
            {@render DayWorkerForm(TimeSlot.SHIFT_1)}

            {@render DayWorkerForm(TimeSlot.SHIFT_2)}

            <hr class="border-base-content mt-2 mb-2" />

            <p
              class="gap-1 text-center font-medium {dayHasManager ||
              canEditWorkers
                ? ''
                : 'text-slate-500'}"
            >
              12:00 - 13:00
            </p>
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
      size="icon"
      onclick={() => handleWeekChange((week.week() - 1).toString())}
      class="size-9 shrink-0"
    >
      <!-- size-9 is same height as Select.Trigger with size="default" -->
      <ChevronLeft class="size-4" />
    </Button>

    <Select.Root
      type="single"
      value={week.week().toString()}
      onValueChange={handleWeekChange}
    >
      <Select.Trigger class="w-[120px]" size="default">
        {m.booking_week()}
        {week.week()}
      </Select.Trigger>
      <Select.Content class="max-h-[300px]">
        <Select.ScrollUpButton />
        <Select.Group>
          {#each weeks as n (n)}
            <Select.Item value={n.toString()}
              >{m.booking_week()} {n}</Select.Item
            >
          {/each}
        </Select.Group>
        <Select.ScrollDownButton />
      </Select.Content>
    </Select.Root>

    <Button
      variant="outline"
      size="icon"
      class="size-9 shrink-0"
      onclick={() => handleWeekChange((week.week() + 1).toString())}
    >
      <ChevronRight class="size-4" />
    </Button>
  </div>
{/snippet}
