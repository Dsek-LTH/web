<script lang="ts">
  import { page } from "$app/stores";
  import ClassBadge from "$lib/components/ClassBadge.svelte";
  import MarkdownBody from "$lib/components/MarkdownBody.svelte";
  import MemberAvatar from "$lib/components/socials/MemberAvatar.svelte";
  import apiNames from "$lib/utils/apiNames";
  import { isAuthorized } from "$lib/utils/authorization";
  import { getFullName } from "$lib/utils/client/member";
  import HeldPositionsYear from "./HeldPositionsYear.svelte";
  import PublishedArticles from "./PublishedArticles.svelte";
  import PublishedEvents from "./PublishedEvents.svelte";
  import UpdateMemberForm from "./UpdateMemberForm.svelte";

  import type { PageData } from "./$types";
  export let data: PageData;
  $: member = data.member;
  $: isMe = data.user?.studentId === $page.params["studentId"];
  $: mandatesGroupedByYear = member.mandates.reduce<
    Record<string, (typeof member)["mandates"]>
  >((acc, mandate) => {
    let year = mandate.startDate.getFullYear().toString();
    if (mandate.endDate.getFullYear() !== mandate.startDate.getFullYear())
      year += `-${mandate.endDate.getFullYear()}`;
    if (!acc[year]) acc[year] = [];
    acc[year]!.push(mandate);
    return acc;
  }, {});
  $: years = Object.keys(mandatesGroupedByYear).sort((a, b) =>
    b.localeCompare(a, "sv"),
  );
  $: publishedEvents = [...member.authoredEvents].reverse();
  $: canEdit = isMe || isAuthorized(apiNames.MEMBER.UPDATE, data.user);
  let isEditing = false;
  const currentDate = new Date();
</script>

<svelte:head>
  <title>{getFullName(member)} | D-sektionen</title>
</svelte:head>
<article class="grid grid-cols-5 gap-x-4" id="container">
  <div class="col-span-2 row-span-3 sm:col-span-1">
    <MemberAvatar {member} class="w-full rounded-lg">
      {#if canEdit}
        <a
          href="{$page.params['studentId']}/profile-picture"
          class="btn btn-square glass btn-secondary btn-sm absolute right-2 top-2"
        >
          <span class="i-mdi-edit" />
        </a>
      {/if}
    </MemberAvatar>
  </div>
  <header class="col-span-3 mb-4 gap-1 sm:col-span-4">
    <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
      <div class="flex-1">
        <h1 class="text-3xl font-bold">
          {getFullName(member)}
        </h1>
      </div>
      {#if canEdit}
        <button
          class="btn"
          on:click={() => {
            isEditing = !isEditing;
          }}
        >
          {isEditing ? "Spara" : "Redigera"}
        </button>
      {/if}
    </div>
    {member.studentId}
  </header>
  <div class={isEditing ? "col-span-4 row-span-2" : "col-span-2"}>
    {#if isEditing}
      <!-- Update user form -->
      <UpdateMemberForm bind:isEditing data={data.form} />
      <!-- End Update user form -->
    {:else}
      <ClassBadge {member} size="xl" />
    {/if}
  </div>
  <article class="col-span-5 row-start-4 md:col-span-1">
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    {#if member.bio}
      <MarkdownBody body={member.bio}>
        <div class="float-right">
          {#if canEdit}
            <a
              href="{$page.params['studentId']}/edit-bio"
              class="btn btn-outline btn-sm"
            >
              Redigera bio
            </a>
          {/if}
        </div>
      </MarkdownBody>
    {:else if canEdit}
      <a
        href="{$page.params['studentId']}/edit-bio"
        class="btn btn-outline btn-sm"
      >
        Lägg till bio
      </a>
    {/if}
  </article>

  <div
    class="col-span-5 row-span-4 flex flex-col sm:flex-row md:col-span-2 md:flex-col"
  >
    <div class="flex-1 md:flex-grow-0">
      <h2 class="mb-2 text-lg">Innehavda poster</h2>
      {#each years as year}
        <HeldPositionsYear
          mandates={mandatesGroupedByYear[year] ?? []}
          {year}
        />
      {/each}
    </div>
    <div class="flex-1 md:flex-grow-0">
      {#if data.publishedArticles.length > 0}
        <PublishedArticles articles={data.publishedArticles} />
      {/if}
      {#if publishedEvents.length > 0}
        <PublishedEvents events={data.member.authoredEvents} />
      {/if}
    </div>
  </div>
  <div class="col-span-5 sm:col-span-3 lg:col-span-2 lg:col-start-1">
    {#if isMe}
      <br />
      <div class="my-2 text-xl font-bold">Dörrar</div>
      {#each member.doorAccessPolicies as door}
        {#if door.startDatetime == null || door.endDatetime == null || (currentDate > door.startDatetime && currentDate < door.endDatetime)}
          <div class="my-2 flex justify-between rounded-lg bg-base-200 p-3">
            <div class="my-auto font-bold">
              {door.doorName}
            </div>
            <div class="flex flex-col">
              {#if door.role}
                <span class="text-xs font-bold opacity-50">
                  {data.doorPositions.find((m) => m.id === door.role)?.name}
                </span>
              {/if}
              {#if door.startDatetime != null && door.endDatetime != null}
                <div>
                  <span class="text-xs font-bold opacity-50">
                    {door.startDatetime?.toLocaleDateString()}-{door.endDatetime?.toLocaleDateString()}
                  </span>
                </div>
              {/if}
            </div>
          </div>
        {/if}
      {/each}
    {/if}
  </div>
</article>
