<script lang="ts">
  import { page } from "$app/stores";
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

  $: groupedByYear = data.mandates.reduce<
    Record<
      string,
      Array<Prisma.MandateGetPayload<{ include: { member: true } }>>
    >
  >((acc, mandate) => {
    let year = mandate.startDate.getFullYear().toString();
    if (mandate.endDate.getFullYear() !== mandate.startDate.getFullYear())
      year += `-${mandate.endDate.getFullYear()}`;
    if (!acc[year]) acc[year] = [];
    acc[year]!.push(mandate);
    return acc;
  }, {});
  $: years = Object.keys(groupedByYear).sort((a, b) =>
    b.localeCompare(a, languageTag()),
  );
  let isEditing = false;
  let isAdding = false;
</script>

<SetPageTitle title={data.position.name} />
<div
  class="mb-4 flex flex-col items-start gap-2 md:flex-row md:items-center md:gap-8"
>
  {#if data.position.committee}
    <a href="/committees/{data.position.committee?.shortName}" class="group">
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
  </div>
</div>

<!-- Edit position form -->
{#if isEditing}
  {#await data.updateForm then form}
    <UpdatePositionForm data={form} />
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
