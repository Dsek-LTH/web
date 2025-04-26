<script lang="ts">
  import { preventDefault } from "svelte/legacy";

  import { page } from "$app/state";
  import ClassBadge from "$lib/components/ClassBadge.svelte";
  import PageHeader from "$lib/components/nav/PageHeader.svelte";
  import MemberAvatar from "$lib/components/socials/MemberAvatar.svelte";
  import apiNames from "$lib/utils/apiNames";
  import { isAuthorized } from "$lib/utils/authorization";
  import { getFullName } from "$lib/utils/client/member";
  import { goto } from "$lib/utils/redirect";
  import * as m from "$paraglide/messages";
  import { languageTag } from "$paraglide/runtime";
  import type { Prisma } from "@prisma/client";
  import AddMandateForm from "./AddMandateForm.svelte";
  import DeleteMandateForm from "./DeleteMandateForm.svelte";
  import UpdateMandateForm from "./UpdateMandateForm.svelte";
  import UpdatePositionForm from "./UpdatePositionForm.svelte";

  import CommitteeIcon from "$lib/components/images/CommitteeIcon.svelte";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import type { PageData } from "./$types";
  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  let groupedByYear = $derived(
    data.mandates.reduce<
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
    }, {}),
  );
  let years = $derived(
    Object.keys(groupedByYear).sort((a, b) =>
      b.localeCompare(a, languageTag()),
    ),
  );
  let isEditing = $state(false);
  let isAdding = $state(false);
  let editedMandate = $derived(page.url.searchParams.get("editMandate"));
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
        {#if isAuthorized(apiNames.MANDATE.CREATE, data.user) && !isEditing}
          <button
            class="btn btn-secondary btn-sm"
            onclick={() => {
              isAdding = !isAdding;
            }}
          >
            {isAdding ? m.positions_cancel() : m.positions_addMandate()}
          </button>
        {/if}
        {#if (!isAdding && isAuthorized(apiNames.MANDATE.UPDATE, data.user)) || isAuthorized(apiNames.MANDATE.DELETE, data.user) || isAuthorized(apiNames.POSITION.UPDATE, data.user)}
          <button
            class="btn btn-sm"
            onclick={async () => {
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
{#if isEditing && isAuthorized(apiNames.POSITION.UPDATE, data.user)}
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
<!-- Edit mandate form -->
{#if editedMandate != undefined}
  {#await data.updateMandateForm then form}
    <UpdateMandateForm data={form} mandateId={editedMandate} />
  {/await}
{/if}

<!-- List of mandates -->
{#each years as year}
  <section class="mb-4">
    <h1 class="mb-2 text-xl font-semibold">{year}</h1>

    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {#each groupedByYear[year] ?? [] as mandate (mandate.id)}
        <div
          class="tooltip flex flex-col whitespace-pre {(groupedByYear[year]
            ?.length ?? 0) <= 8
            ? 'col-span-2'
            : ''}"
          data-tip={getFullName(mandate.member) +
            `\n${mandate.startDate.toLocaleDateString(
              languageTag(),
            )} - ${mandate.endDate.toLocaleDateString(languageTag())}`}
        >
          <a
            href="/members/{mandate.member.studentId}"
            class="btn btn-ghost w-full flex-nowrap justify-start normal-case {isEditing
              ? 'pointer-events-none'
              : ''}"
          >
            <MemberAvatar member={mandate.member} />
            <span
              class="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-left font-medium"
            >
              {getFullName(mandate.member)}
            </span>
          </a>

          <!-- Remove and edit buttons -->
          {#if isEditing}
            {#if isAuthorized(apiNames.MANDATE.UPDATE, data.user)}
              <button
                class="btn btn-secondary btn-sm pointer-events-auto"
                onclick={preventDefault(async () => {
                  await goto(
                    `positions/${data.position.id}?editMandate=${mandate.id}`,
                  );
                })}
              >
                {m.positions_edit()}
              </button>
            {/if}
            {#if isAuthorized(apiNames.MANDATE.DELETE, data.user)}
              {#await data.deleteMandateForm then form}
                <DeleteMandateForm mandateId={mandate.id} data={form} />
              {/await}
            {/if}
          {:else}
            <ClassBadge member={mandate.member} />
          {/if}
          {#if isEditing}
            <span class="text-xs">
              {mandate.startDate.toLocaleDateString(languageTag())} - {mandate.endDate.toLocaleDateString(
                languageTag(),
              )}
            </span>
          {/if}
        </div>
      {/each}
    </div>
  </section>
{/each}
