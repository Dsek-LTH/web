<script lang="ts">
  import apiNames from "$lib/utils/apiNames";
  import { isAuthorized } from "$lib/utils/authorization";
  import * as m from "$paraglide/messages";
  import type { Prisma } from "@prisma/client";
  import AddMandateForm from "./AddMandateForm.svelte";
  import UpdatePositionForm from "./UpdatePositionForm.svelte";
  import Mandate from "./Mandate.svelte";

  import CommitteeIcon from "$lib/components/images/CommitteeIcon.svelte";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import type { PageData } from "./$types";
  import { Button, buttonVariants } from "$lib/components/ui/button";
  import * as Dialog from "$lib/components/ui/dialog";
  import { cn } from "$lib/utils";
  import Pen from "@lucide/svelte/icons/pen";
  import { Progress } from "$lib/components/ui/progress";

  let { data }: { data: PageData } = $props();

  const mandateStatsCutoffYears = 7;

  type MandateWithMember = Prisma.MandateGetPayload<{
    include: { member: true };
  }>;

  let groupedByYear = $derived(
    data.mandates.reduce<Record<string, MandateWithMember[]>>(
      (acc, mandate) => {
        let year = mandate.startDate.getFullYear().toString();
        if (mandate.endDate.getFullYear() !== mandate.startDate.getFullYear())
          year += `-${mandate.endDate.getFullYear()}`;
        if (!acc[year]) acc[year] = [];
        acc[year]!.push(mandate);
        return acc;
      },
      {},
    ),
  );
  let years = $derived(
    Object.keys(groupedByYear).sort((a, b) => b.localeCompare(a, "sv-SE")),
  );

  // Mandates per study year
  function getStudyYear(mandate: MandateWithMember): number | null {
    const start = mandate.startDate;
    const classYear = mandate.member.classYear;
    if (!classYear || isNaN(start.getTime())) return null;

    const startAcademicYear =
      start.getMonth() >= 7
        ? start.getFullYear() // Aug-Dec -> same year
        : start.getFullYear() - 1; // Jan-Jul -> previous year

    const studyYear = startAcademicYear - classYear + 1;
    return studyYear >= 1 ? studyYear : null;
  }
  let mandateYearRatios = $state(
    (() => {
      let totalMandateCount = 0;
      const counts: Record<number, number> = {};
      const currentYear = new Date().getFullYear();
      for (const mandate of data.mandates) {
        const mandateStartYear = mandate.startDate.getFullYear();
        const studyYear = getStudyYear(mandate);
        if (
          studyYear === null ||
          currentYear - mandateStartYear > mandateStatsCutoffYears
        ) {
          continue;
        }
        counts[studyYear] = (counts[studyYear] ?? 0) + 1;
        totalMandateCount++;
      }

      // Dynamically generate stats for all study years present
      return Object.keys(counts)
        .map(Number)
        .sort((a, b) => a - b)
        .map((studyYear) => ({
          studyYear,
          percentage: counts
            ? (counts[studyYear]! / totalMandateCount) * 100
            : 0,
        }));
    })(),
  );
  let isEditing = $state(false);
  let isAdding = $state(false);
</script>

<SetPageTitle title={data.position.name} />

<div class="layout-container">
  <div
    class="mb-4 flex flex-col items-start gap-2 md:flex-row md:items-center md:gap-8"
  >
    {#if data.position.committee}
      <a
        href="/committees/{data.position.committee?.shortName}"
        class="group self-start"
      >
        <figure
          class="h-32 w-32 transition-transform group-hover:scale-95 md:h-40 md:w-40"
        >
          <CommitteeIcon committee={data.position.committee} />
        </figure>
      </a>
    {/if}
    <div class="w-full">
      <div class="flex w-full flex-wrap items-center justify-between gap-x-2">
        <h2>{data.position.name}</h2>
        <div class="flex flex-row gap-2">
          {#if isAuthorized(apiNames.MANDATE.CREATE, data.user)}
            <Button
              size="sm"
              variant="rosa"
              onclick={() => {
                isAdding = !isAdding;
              }}
            >
              {isAdding ? m.positions_cancel() : m.positions_addMandate()}
            </Button>
          {/if}
          {#if isAuthorized(apiNames.POSITION.UPDATE, data.user)}
            <Dialog.Root>
              <Dialog.Trigger
                class={cn(buttonVariants({ size: "sm", variant: "lila" }))}
                ><Pen />
                {isEditing
                  ? m.positions_stopEditing()
                  : m.positions_edit()}</Dialog.Trigger
              >

              <Dialog.Content
                class="z-51 max-h-[80vh] overflow-y-scroll rounded-md pt-4 sm:max-w-[625px]"
                >{#await data.updateForm then form}
                  <UpdatePositionForm
                    data={form}
                    onSubmit={() => {
                      isEditing = false;
                    }}
                  />
                {/await}</Dialog.Content
              >
            </Dialog.Root>
          {/if}
        </div>
      </div>

      {#if data.position.description}
        <p>{data.position.description}</p>
      {/if}

      {#if data.position.email}
        <section>
          <a
            class="link-hover link link-primary"
            href="mailto:{data.position.email}"
          >
            {data.position.email}
          </a>
        </section>
      {/if}
      {#if data.position.emailAliases.length > 0}
        <h4 class="text-xs opacity-75">
          {m.positions_theFollowingAddresses()}
        </h4>
        <div class="mb-2 flex gap-2 text-xs opacity-75">
          {#each data.position.emailAliases.filter((alias) => alias.email != data.position.email) as alias (alias.email)}
            <a class="link-hover link link-primary" href="mailto:{alias.email}">
              {alias.email}
            </a>
          {/each}
        </div>
      {/if}
      {#if mandateYearRatios.length !== 0}
        <div class="mt-4 w-full border-t pt-4">
          <h2 class="flex items-center gap-2 text-lg">
            {m.positions_historical_mandate_distribution_per_study_year()}
            <span class="text-muted-foreground text-sm">
              ({mandateStatsCutoffYears}&nbsp;{m.positions_years()})
            </span>
          </h2>
          {#each mandateYearRatios as { studyYear, percentage } (studyYear)}
            <div class="flex w-64 flex-row items-center gap-2">
              <div class="w-24">
                {m.positions_study_year()}&nbsp;{studyYear}
              </div>
              <Progress value={percentage} max={100} />
              <div class="text-muted-foreground w-16 text-right text-xs">
                {percentage.toFixed(1)}%
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>

  <!-- Add mandate form -->
  {#if isAdding}
    {#await data.addMandateForm then form}
      <AddMandateForm
        data={form}
        onClose={() => {
          isAdding = false;
        }}
      />
    {/await}
  {/if}

  <!-- List of mandates -->
  <h3 class="mb-4">{m.positions_history()}</h3>
  {#each years as year (year)}
    <section
      class="bg-muted-background mb-4 flex flex-col gap-4 rounded-md border-[1px] p-4"
    >
      <h4>{year}</h4>

      <div class="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
        {#each groupedByYear[year] ?? [] as mandate (mandate.id)}
          <Mandate {data} {mandate} />
        {/each}
      </div>
    </section>
  {/each}

  <Button variant="outline" href="/positions"
    >{m.positions_all_positions()}</Button
  >
</div>
