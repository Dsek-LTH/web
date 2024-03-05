<script lang="ts">
  import DoorAccess from "./DoorAccess.svelte";
  import HeldPositionsYear from "./HeldPositionsYear.svelte";
  import PublishedArticles from "./PublishedArticles.svelte";
  import PublishedEvents from "./PublishedEvents.svelte";
  import UpdateMemberForm from "./UpdateMemberForm.svelte";
  import PingButton from "./PingButton.svelte";

  import { page } from "$app/stores";
  import MarkdownBody from "$lib/components/MarkdownBody.svelte";
  import MemberAvatar from "$lib/components/socials/MemberAvatar.svelte";
  import apiNames from "$lib/utils/apiNames";
  import { isAuthorized } from "$lib/utils/authorization";
  import { getFullName } from "$lib/utils/client/member";

  import type { PageData } from "./$types";

  export let data: PageData;
  $: member = data.viewedMember;
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
  $: ping = data.ping;
  let isEditing = false;
</script>

<svelte:head>
  <title>{getFullName(member)} | D-sektionen</title>
</svelte:head>
<article class="profile-grid grid gap-x-4 gap-y-2 self-stretch" id="container">
  <MemberAvatar {member} class="avatar-area w-full rounded-lg">
    {#if canEdit}
      <a
        href="{$page.params['studentId']}/profile-picture"
        class="btn btn-square glass btn-secondary btn-sm absolute right-2 top-2"
      >
        <span class="i-mdi-edit" />
      </a>
    {/if}
  </MemberAvatar>
  <header class="header grid">
    <h1 class="name text-3xl font-bold lg:text-6xl">{getFullName(member)}</h1>
    <div class="actions">
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
      {#if data.user && !isMe}
        <PingButton {ping} />
      {/if}
    </div>
    {#if data.email}
      {data.email}<br />
    {/if}
    {member.studentId}
    <!-- {/if} 
    <div class="details flex flex-row gap-2 text-nowrap">
      {member.studentId}
      <ClassBadge {member} size="xl" />
    </div> -->
  </header>

  <article class="bio">
    {#if isEditing}
      <!-- Update user form -->
      <UpdateMemberForm bind:isEditing data={data.form} />
      <!-- End Update user form -->
    {:else if member.bio}
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

  <div class="sidebar flex flex-col">
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
        <PublishedEvents events={member.authoredEvents} />
      {/if}
    </div>
  </div>

  <div class="footer flex flex-col items-stretch gap-2">
    {#if data.doorAccess.length > 0}
      <DoorAccess doorAccess={data.doorAccess} />
    {/if}
  </div>
</article>

<style lang="postcss">
  .bio {
    grid-area: bio;
  }
  .footer {
    grid-area: footer;
  }

  .sidebar {
    grid-area: sidebar;
  }

  .avatar-area {
    grid-area: avatar;
  }
  .actions {
    grid-area: actions;
  }
  .name {
    grid-area: name;
  }
  .details {
    grid-area: details;
  }

  .profile-grid {
    grid-template-columns: minmax(2rem, 12rem) 3fr;
    grid-template-rows: auto auto auto auto;
    grid-template-areas:
      "avatar   header"
      "bio      bio    "
      "sidebar  sidebar"
      "footer   footer ";
  }
  .header {
    @apply grid justify-between;
    grid-area: header;
    grid-template-columns: 1fr auto;
    grid-template-areas:
      "name"
      "actions"
      "details";
  }

  @media (min-width: 640px) {
    .profile-grid {
      grid-template-columns: 1fr 2fr 2fr;
      grid-template-rows: auto auto 1fr;
      grid-template-areas:
        "avatar   header  header"
        "bio      bio     sidebar"
        "footer   footer  sidebar";
    }
    .header {
      @apply grid justify-between;
      grid-area: header;
      grid-template-rows: auto 1fr;
      grid-template-columns: 1fr auto;
      grid-template-areas:
        "name actions"
        "details details";
    }
  }
  @media (min-width: 1024px) {
    .profile-grid {
      grid-template-columns: 1fr 1fr 1fr;
      grid-template-areas:
        "avatar   header  header"
        "bio      bio     sidebar"
        "footer   .  sidebar";
    }
  }
</style>
