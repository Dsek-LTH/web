<script lang="ts">
  import { enhance } from "$app/forms";
  import Labeled from "$lib/components/Labeled.svelte";
  import PageHeader from "$lib/components/PageHeader.svelte";
  import MemberAvatar from "$lib/components/socials/MemberAvatar.svelte";
  import apiNames from "$lib/utils/apiNames";
  import { getFullName } from "$lib/utils/member.js";
  import type { Prisma } from "@prisma/client";
  export let data;
  $: groupedByYear = data.mandates.reduce(
    (acc, mandate) => {
      let year = mandate.startDate.getFullYear().toString();
      if (mandate.endDate.getFullYear() !== mandate.startDate.getFullYear())
        year += `-${mandate.endDate.getFullYear()}`;
      if (!acc[year]) acc[year] = [];
      acc[year]!.push(mandate);
      return acc;
    },
    {} as Record<string, Prisma.MandateGetPayload<{ include: { member: true } }>[]>
  );
  $: years = Object.keys(groupedByYear).sort((a, b) => b.localeCompare(a, "sv"));
  let isEditing = false;
  let editedMandate: (typeof data.mandates)[number] | undefined = undefined;
</script>

<div class="flex items-center justify-between">
  <PageHeader title={data.position.name} />
  {#if data.accessPolicies.includes(apiNames.MANDATE.UPDATE) || data.accessPolicies.includes(apiNames.MANDATE.DELETE)}
    <button
      class="btn btn-secondary btn-sm"
      on:click={() => {
        isEditing = !isEditing;
        editedMandate = undefined;
      }}
    >
      {isEditing ? "Sluta redigera" : "Redigera"}
    </button>
  {/if}
</div>
{#if editedMandate != undefined}
  <form
    action="?/update"
    method="POST"
    use:enhance={() => {
      return async ({ update }) => {
        editedMandate = undefined;
        await update();
      };
    }}
    class="form-control my-2 flex-row items-end gap-2"
  >
    <input type="hidden" name="mandateId" value={editedMandate.id} />
    <Labeled label="Start" id="startDate">
      <input
        name="startDate"
        id="startDate"
        value={editedMandate.startDate.toISOString().substring(0, 10)}
        class="input input-bordered"
        type="date"
      />
    </Labeled>
    <Labeled label="End" id="endDate">
      <input
        name="endDate"
        id="endDate"
        value={editedMandate.endDate.toISOString().substring(0, 10)}
        class="input input-bordered"
        type="date"
      />
    </Labeled>
    <button type="submit" class="btn btn-secondary">Spara</button>
  </form>
{/if}
{#each years as year}
  <section class="mb-4">
    <h1 class="mb-2 text-xl font-semibold">{year}</h1>

    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {#each groupedByYear[year] ?? [] as mandate (mandate.id)}
        <div
          class="tooltip flex flex-col whitespace-pre {(groupedByYear[year]?.length ?? 0) <= 8
            ? 'col-span-2'
            : ''}"
          data-tip={getFullName(mandate.member) +
            `\n${mandate.startDate.toLocaleDateString("sv")}-${mandate.endDate.toLocaleDateString(
              "sv"
            )}`}
        >
          <a
            href="/members/{mandate.member.studentId}"
            class="btn btn-ghost w-full flex-nowrap justify-start normal-case"
          >
            <MemberAvatar member={mandate.member} />
            <h3
              class="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-left font-medium"
            >
              {getFullName(mandate.member)}
            </h3>

            {#if isEditing && data.accessPolicies.includes(apiNames.MANDATE.DELETE)}
              <button
                class="btn btn-secondary btn-sm"
                on:click|preventDefault={() => {
                  editedMandate = mandate;
                }}
              >
                EDIT
              </button>
              <form action="?/delete" method="POST" use:enhance>
                <input type="hidden" name="mandateId" value={mandate.id} />
                <button
                  type="submit"
                  class="btn btn-error btn-sm"
                  on:click|stopPropagation={() => {}}
                >
                  X
                </button>
              </form>
            {:else if mandate.member.classProgramme && mandate.member.classYear}
              <span
                class="badge badge-outline badge-sm text-xs font-light {mandate.member
                  .classProgramme === 'C'
                  ? 'badge-secondary'
                  : 'badge-primary'} "
                >{mandate.member.classProgramme}{mandate.member.classYear
                  ?.toString()
                  .substring(2)}</span
              >
            {/if}
          </a>
          {#if isEditing}
            <span class="text-xs">
              {mandate.startDate.toLocaleDateString("sv")} - {mandate.endDate.toLocaleDateString(
                "sv"
              )}
            </span>
          {/if}
        </div>
      {/each}
    </div>
  </section>
{/each}
