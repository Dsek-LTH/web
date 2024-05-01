<script lang="ts">
  import { goto } from "$lib/utils/redirect";
  import { page } from "$app/stores";
  import ClassBadge from "$lib/components/ClassBadge.svelte";
  import PageHeader from "$lib/components/PageHeader.svelte";
  import MemberAvatar from "$lib/components/socials/MemberAvatar.svelte";
  import apiNames from "$lib/utils/apiNames";
  import { isAuthorized } from "$lib/utils/authorization";
  import { getFullName } from "$lib/utils/client/member";
  import type { Prisma } from "@prisma/client";
  import AddMandateForm from "./AddMandateForm.svelte";
  import DeleteMandateForm from "./DeleteMandateForm.svelte";
  import UpdateMandateForm from "./UpdateMandateForm.svelte";
  import UpdatePositionForm from "./UpdatePositionForm.svelte";

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
    b.localeCompare(a, "sv"),
  );
  let isEditing = false;
  let isAdding = false;
  $: editedMandate = $page.url.searchParams.get("editMandate");
</script>

<svelte:head>
  <title>{data.position.name} | D-sektionen</title>
</svelte:head>

<div class="flex flex-wrap items-center justify-between gap-x-2">
  <PageHeader title={data.position.name} />
  <div>
    {#if isAuthorized(apiNames.MANDATE.CREATE, data.user) && !isEditing}
      <button
        class="btn btn-secondary btn-sm"
        on:click={() => {
          isAdding = !isAdding;
        }}
      >
        {isAdding ? "Avbryt" : "Lägg till mandat"}
      </button>
    {/if}
    {#if (!isAdding && isAuthorized(apiNames.MANDATE.UPDATE, data.user)) || isAuthorized(apiNames.MANDATE.DELETE, data.user) || isAuthorized(apiNames.POSITION.UPDATE, data.user)}
      <button
        class="btn btn-sm"
        on:click={async () => {
          isEditing = !isEditing;
          await goto(`${data.position.id}`);
        }}
      >
        {isEditing ? "Sluta redigera" : "Redigera"}
      </button>
    {/if}
  </div>
</div>

{#if data.position.description}
  <p>{data.position.description}</p>
{/if}

{#if data.position.email}
  <section>
    <a class="link-hover link link-primary" href="mailto:{data.position.email}">
      {data.position.email}
    </a>
  </section>
{/if}
{#if data.position.emailAliases.length > 0}
  <h4 class="text-xs opacity-75">
    Följande adresser skickas också till posten
  </h4>
  <div class="mb-2 flex gap-2 text-xs opacity-75">
    {#each data.position.emailAliases.filter((alias) => alias.email != data.position.email) as alias}
      <a class="link-hover link link-primary" href="mailto:{alias.email}">
        {alias.email}
      </a>
    {/each}
  </div>
{/if}

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
              "sv",
            )} - ${mandate.endDate.toLocaleDateString("sv")}`}
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

            <!-- Remove and edit buttons -->
            {#if isEditing}
              {#if isAuthorized(apiNames.MANDATE.UPDATE, data.user)}
                <button
                  class="btn btn-secondary btn-sm pointer-events-auto"
                  on:click|preventDefault={async () => {
                    await goto(`${data.position.id}?editMandate=${mandate.id}`);
                  }}
                >
                  EDIT
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
          </a>
          {#if isEditing}
            <span class="text-xs">
              {mandate.startDate.toLocaleDateString("sv")} - {mandate.endDate.toLocaleDateString(
                "sv",
              )}
            </span>
          {/if}
        </div>
      {/each}
    </div>
  </section>
{/each}
