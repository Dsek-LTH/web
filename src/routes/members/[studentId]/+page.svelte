<script lang="ts">
  import UpdateMemberForm from "./UpdateMemberForm.svelte";
  import PublishedEvents from "./PublishedEvents.svelte";
  import PublishedArticles from "./PublishedArticles.svelte";
  import HeldPositionsYear from "./HeldPositionsYear.svelte";

  import { page } from "$app/stores";
  import ClassBadge from "$lib/components/ClassBadge.svelte";
  import MarkdownBody from "$lib/components/MarkdownBody.svelte";
  import MemberAvatar from "$lib/components/socials/MemberAvatar.svelte";
  import apiNames from "$lib/utils/apiNames";
  import { getFullName } from "$lib/utils/member";

  export let data;
  export let form;
  $: member = data.member;
  $: isMe = data.session?.user?.student_id === $page.params.studentId;
  $: mandatesGroupedByYear = member.mandates.reduce(
    (acc, mandate) => {
      let year = mandate.startDate.getFullYear().toString();
      if (mandate.endDate.getFullYear() !== mandate.startDate.getFullYear())
        year += `-${mandate.endDate.getFullYear()}`;
      if (!acc[year]) acc[year] = [];
      acc[year]!.push(mandate);
      return acc;
    },
    {} as Record<string, (typeof member)["mandates"]>
  );
  $: years = Object.keys(mandatesGroupedByYear).sort((a, b) => b.localeCompare(a, "sv"));
  $: publishedEvents = [...member.authoredEvents].reverse();
  $: canEdit = isMe || data.accessPolicies.includes(apiNames.MEMBER.UPDATE);
  let isEditing = false;
</script>

<svelte:head>
  <title>{getFullName(member)} | D-sektionen</title>
</svelte:head>
<article class="grid grid-cols-5 gap-x-4" id="container">
  <div class="col-span-2 row-span-3 sm:col-span-1">
    <MemberAvatar {member} size={null} rounded="rounded-lg">
      {#if canEdit}
        <a
          href="{$page.params.studentId}/profile-picture"
          class="btn btn-square btn-secondary glass btn-sm absolute right-2 top-2"
        >
          <span class="i-mdi-edit" />
        </a>
      {/if}
    </MemberAvatar>
  </div>
  <header class="col-span-3 mb-4 gap-1 sm:col-span-4">
    <div class="flex items-center">
      <div class="flex-1">
        <h1 class="text-3xl font-bold">{getFullName(member)}</h1>
      </div>
      {#if canEdit}
        <button
          class="btn btn-secondary"
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
      <UpdateMemberForm bind:isEditing {member} {form} />
      <!-- End Update user form -->
    {:else}
      <ClassBadge {member} size="xl" />
    {/if}
  </div>
  {#if member.bio}
    <article class="col-span-5 row-start-4 md:col-span-3">
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      <MarkdownBody body={member.bio}>
        <div slot="before-body" class="float-right">
          {#if canEdit}
            <a href="{$page.params.studentId}/edit-bio" class="btn btn-secondary btn-outline btn-sm"
              >Redigera bio</a
            >
          {/if}
        </div>
      </MarkdownBody>
    </article>
  {/if}
  <div class="col-span-5 row-span-4 flex flex-col sm:flex-row md:col-span-2 md:flex-col">
    <div class="flex-1 md:flex-grow-0">
      <h2 class="mb-2 text-lg">Innehavda poster</h2>
      {#each years as year}
        <HeldPositionsYear mandates={mandatesGroupedByYear[year] ?? []} {year} />
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
</article>
