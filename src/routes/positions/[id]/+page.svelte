<script lang="ts">
  import EditPositionForm from "./UpdatePositionForm.svelte";

  import DeleteMandateForm from "./DeleteMandateForm.svelte";

  import ClassBadge from "$lib/components/ClassBadge.svelte";

  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import PageHeader from "$lib/components/PageHeader.svelte";
  import MemberAvatar from "$lib/components/socials/MemberAvatar.svelte";
  import apiNames from "$lib/utils/apiNames";
  import { getFullName } from "$lib/utils/client/member";
  import type { Prisma } from "@prisma/client";
  import AddMandateForm from "./AddMandateForm.svelte";
  import UpdateMandateForm from "./UpdateMandateForm.svelte";
  export let data;
  $: groupedByYear = data.mandates.reduce<
    Record<string, Prisma.MandateGetPayload<{ include: { member: true } }>[]>
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

<div class="flex items-center justify-between">
  <PageHeader title={data.position.name} />
  <div>
    {#if data.accessPolicies.includes(apiNames.MANDATE.CREATE) && !isEditing}
      <button
        class="btn btn-secondary btn-sm"
        on:click={() => {
          isAdding = !isAdding;
        }}
      >
        {isAdding ? "Avbryt" : "Lägg till mandat"}
      </button>
    {/if}
    {#if !isAdding && (data.accessPolicies.includes(apiNames.MANDATE.UPDATE) || data.accessPolicies.includes(apiNames.MANDATE.DELETE) || data.accessPolicies.includes(apiNames.POSITION.UPDATE))}
      <button
        class="btn btn-secondary btn-sm"
        on:click={() => {
          isEditing = !isEditing;
          goto(`${data.position.id}`);
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
{#if isEditing && data.accessPolicies.includes(apiNames.POSITION.UPDATE)}
  <EditPositionForm data={data.updateForm} />
{/if}

<!-- Add mandate form -->
{#if isAdding}
  <AddMandateForm
    data={data.addMandateForm}
    onClose={() => {
      isAdding = false;
    }}
  />
{/if}
<!-- Edit mandate form -->
{#if editedMandate != undefined}
  <UpdateMandateForm data={data.updateMandateForm} mandateId={editedMandate} />
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
          data-tip={getFullName($page.data.session?.user, mandate.member) +
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
              {getFullName($page.data.session?.user, mandate.member)}
            </span>

            <!-- Remove and edit buttons -->
            {#if isEditing}
              {#if data.accessPolicies.includes(apiNames.MANDATE.UPDATE)}
                <button
                  class="btn btn-secondary btn-sm pointer-events-auto"
                  on:click|preventDefault={() => {
                    goto(`${data.position.id}?editMandate=${mandate.id}`);
                  }}
                >
                  EDIT
                </button>
              {/if}
              {#if data.accessPolicies.includes(apiNames.MANDATE.DELETE)}
                <DeleteMandateForm
                  mandateId={mandate.id}
                  data={data.deleteMandateForm}
                />
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
