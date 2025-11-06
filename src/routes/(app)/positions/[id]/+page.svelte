<script lang="ts">
  import PageHeader from "$lib/components/nav/PageHeader.svelte";
  import apiNames from "$lib/utils/apiNames";
  import { isAuthorized } from "$lib/utils/authorization";
  import * as m from "$paraglide/messages";
  import { languageTag } from "$paraglide/runtime";
  import type { Prisma } from "@prisma/client";
  import AddMandateForm from "./AddMandateForm.svelte";
  import UpdatePositionForm from "./UpdatePositionForm.svelte";
  import Mandate from "./Mandate.svelte";

  import CommitteeIcon from "$lib/components/images/CommitteeIcon.svelte";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import type { PageData } from "./$types";
  export let data: PageData;

  const mandateStatsCutoffYears = 7;

  type MandateWithMember = Prisma.MandateGetPayload<{
    include: { member: true };
  }>;

  $: groupedByYear = data.mandates.reduce<Record<string, MandateWithMember[]>>(
    (acc, mandate) => {
      let year = mandate.startDate.getFullYear().toString();
      if (mandate.endDate.getFullYear() !== mandate.startDate.getFullYear())
        year += `-${mandate.endDate.getFullYear()}`;
      if (!acc[year]) acc[year] = [];
      acc[year]!.push(mandate);
      return acc;
    },
    {},
  );
  $: years = Object.keys(groupedByYear).sort((a, b) =>
    b.localeCompare(a, languageTag()),
  );

  // Mandates per årskurs
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
  $: mandateYearRatios = (() => {
    let totalMandateCount = 0;
    const counts: Record<number, number> = {};
    for (const mandate of data.mandates) {
      const studyYear = getStudyYear(mandate);
      if (studyYear === null || studyYear > mandateStatsCutoffYears) {
        continue;
      }
      counts[studyYear] = (counts[studyYear] ?? 0) + 1;
      totalMandateCount++;
    }

    // Dynamically generate stats for all årskurser present
    return Object.keys(counts)
      .map(Number)
      .sort((a, b) => a - b)
      .map((studyYear) => ({
        studyYear,
        percentage: counts ? (counts[studyYear]! / totalMandateCount) * 100 : 0,
      }));
  })();
  let isEditing = false;
  let isAdding = false;
</script>

<SetPageTitle title={data.position.name} />
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
  <div>
    <div class="flex flex-wrap items-center justify-between gap-x-2">
      <PageHeader title={data.position.name} />
      <div>
        {#if isAuthorized(apiNames.MANDATE.CREATE, data.user)}
          <button
            class="btn btn-secondary btn-sm"
            on:click={() => {
              isAdding = !isAdding;
            }}
          >
            {isAdding ? m.positions_cancel() : m.positions_addMandate()}
          </button>
        {/if}
        {#if isAuthorized(apiNames.POSITION.UPDATE, data.user)}
          <button
            class="btn btn-sm"
            on:click={async () => {
              isEditing = !isEditing;
            }}
          >
            {isEditing ? m.positions_stopEditing() : m.positions_edit()}
          </button>
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
        {#each data.position.emailAliases.filter((alias) => alias.email != data.position.email) as alias}
          <a class="link-hover link link-primary" href="mailto:{alias.email}">
            {alias.email}
          </a>
        {/each}
      </div>
    {/if}
    {#if mandateYearRatios.length !== 0}
      <div class="flex-box mt-4 w-full border-t pt-4">
        <h2 class="flex items-center gap-2 text-lg">
          {m.positions_historical_mandate_distribution_per_study_year()}
          <span class="text-sm text-neutral-400">
            ({mandateStatsCutoffYears}&nbsp;{m.positions_years()})
          </span>
        </h2>
        {#each mandateYearRatios as { studyYear, percentage }}
          <div class="flex w-64 flex-row items-center gap-2">
            <div class="bar-label w-24">
              {m.positions_study_year()}&nbsp;{studyYear}
            </div>
            <progress class="progress" value={percentage} max="100"></progress>
            <div class="text-xs text-neutral-400">{percentage.toFixed(1)}%</div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<!-- Edit position form -->
{#if isEditing}
  {#await data.updateForm then form}
    <UpdatePositionForm
      data={form}
      onSubmit={() => {
        isEditing = false;
      }}
    />
  {/await}
{/if}

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
{#each years as year}
  <section class="mb-4">
    <h1 class="mb-2 text-xl font-semibold">{year}</h1>

    <div class="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-2">
      {#each groupedByYear[year] ?? [] as mandate (mandate.id)}
        <Mandate {data} {mandate} />
      {/each}
    </div>
  </section>
{/each}

<a class="btn" href="/positions">{m.positions_all_positions()}</a>
