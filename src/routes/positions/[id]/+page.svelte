<script lang="ts">
  import { enhance } from "$app/forms";
  import Labeled from "$lib/components/Labeled.svelte";
  import PageHeader from "$lib/components/PageHeader.svelte";
  import MemberAvatar from "$lib/components/socials/MemberAvatar.svelte";
  import apiNames from "$lib/utils/apiNames";
  import { getFullName } from "$lib/utils/member.js";
  import type { Prisma } from "@prisma/client";
  import AddMandateForm from "./AddMandateForm.svelte";
  export let data;
  export let form;
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
  let isAdding = false;
  let editedMandate: (typeof data.mandates)[number] | undefined = undefined;
</script>

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
          editedMandate = undefined;
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
    <a class="link-hover link-primary link" href="mailto:{data.position.email}">
      {data.position.email}
    </a>
  </section>
{/if}
{#if data.position.emailAliases.length > 0}
  <h4 class="text-xs opacity-75">Följande adresser skickas också till posten</h4>
  <div class="mb-2 flex gap-2 text-xs opacity-75">
    {#each data.position.emailAliases.filter((alias) => alias.email != data.position.email) as alias}
      <a class="link-hover link-primary link" href="mailto:{alias.email}">
        {alias.email}
      </a>
    {/each}
  </div>
{/if}

<!-- Edit position form -->
{#if isEditing && data.accessPolicies.includes(apiNames.POSITION.UPDATE)}
  <form
    action="?/update"
    method="POST"
    use:enhance={() =>
      async ({ update }) => {
        await update({ reset: false });
        isEditing = false;
      }}
    class="form-control"
  >
    <Labeled label="Namn" id="name">
      <input
        name="name"
        id="name"
        value={form?.data?.name ?? data.position.name}
        class="input input-bordered"
        type="text"
      />
    </Labeled>
    <Labeled label="Beskrivning" id="description">
      <textarea
        name="description"
        id="description"
        class="textarea textarea-bordered"
        rows="3"
        value={form?.data?.description ?? data.position.description}
      />
    </Labeled>
    <Labeled
      label="Email"
      id="email"
      explanation="Det här ändrar inte mailservern, utan säger bara vilken som är den primära mailadressen för den här posten."
    >
      <input
        name="email"
        id="email"
        value={form?.data?.email ?? data.position.email}
        class="input input-bordered"
        type="email"
      />
    </Labeled>
    <button type="submit" class="btn btn-secondary my-2">Spara</button>
  </form>
{/if}

<!-- Add mandate form -->
{#if isAdding}
  <AddMandateForm
    onClose={() => {
      isAdding = false;
    }}
  />
{/if}
<!-- Edit mandate form -->
{#if editedMandate != undefined}
  <form
    action="?/updateMandate"
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

<!-- List of mandates -->
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
            `\n${mandate.startDate.toLocaleDateString("sv")} - ${mandate.endDate.toLocaleDateString(
              "sv"
            )}`}
        >
          <a
            href="/members/{mandate.member.studentId}"
            class="btn btn-ghost w-full flex-nowrap justify-start normal-case {isEditing
              ? 'pointer-events-none'
              : ''}"
          >
            <MemberAvatar member={mandate.member} />
            <h3
              class="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-left font-medium"
            >
              {getFullName(mandate.member)}
            </h3>

            <!-- Remove and edit buttons -->
            {#if isEditing}
              {#if data.accessPolicies.includes(apiNames.MANDATE.UPDATE)}
                <button
                  class="btn btn-secondary btn-sm pointer-events-auto"
                  on:click|preventDefault={() => {
                    editedMandate = mandate;
                  }}
                >
                  EDIT
                </button>
              {/if}
              {#if data.accessPolicies.includes(apiNames.MANDATE.DELETE)}
                <form action="?/deleteMandate" method="POST" use:enhance>
                  <input type="hidden" name="mandateId" value={mandate.id} />
                  <button
                    type="submit"
                    class="btn btn-error btn-sm pointer-events-auto"
                    on:click|stopPropagation={() => {}}
                  >
                    X
                  </button>
                </form>
              {/if}
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
