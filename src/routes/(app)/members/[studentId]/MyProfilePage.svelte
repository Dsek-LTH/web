<script lang="ts">
  import DoorAccess from "./DoorAccess.svelte";

  import { page } from "$app/stores";
  import MarkdownBody from "$lib/components/MarkdownBody.svelte";
  import MemberAvatar from "$lib/components/socials/MemberAvatar.svelte";
  import { getFullName } from "$lib/utils/client/member";
  import PublishedArticles from "./PublishedArticles.svelte";
  import PublishedEvents from "./PublishedEvents.svelte";
  import UpdateMemberForm from "./UpdateMemberForm.svelte";

  import type { PageData } from "./$types";
  import HeldPositions from "./HeldPositions.svelte";
  import ProfileHeader from "./ProfileHeader.svelte";
  import EditButton from "./EditButton.svelte";
  export let data: PageData;
  $: member = data.member;

  $: publishedEvents = [...member.authoredEvents].reverse();
  let isEditing = false;
</script>

<svelte:head>
  <title>{getFullName(member)} | D-sektionen</title>
</svelte:head>
<article
  class="grid grid-cols-1-2 gap-x-4 gap-y-2 md:grid-cols-5"
  id="container"
>
  <div class="md:col-start-1 md:col-end-2">
    <MemberAvatar {member} class="w-full rounded-lg">
      <a
        href="{$page.params['studentId']}/profile-picture"
        class="btn btn-square glass btn-secondary btn-sm absolute right-2 top-2"
      >
        <span class="i-mdi-edit" />
      </a>
    </MemberAvatar>
  </div>
  <!-- Name, StiL-ID, badge and actions -->
  <header class="md:col-start-2 md:col-end-4">
    <ProfileHeader {member} canEdit bind:isEditing />
  </header>

  <!-- Bio -->
  <article class="col-span-2 md:col-start-1 md:col-end-4 md:row-start-2">
    {#if isEditing}
      <UpdateMemberForm bind:isEditing data={data.form} />
    {:else if member.bio}
      <MarkdownBody body={member.bio}>
        <div class="float-right">
          <a
            href="{$page.params['studentId']}/edit-bio"
            class="btn btn-outline btn-sm"
          >
            Redigera bio
          </a>
        </div>
      </MarkdownBody>
    {:else}
      <a
        href="{$page.params['studentId']}/edit-bio"
        class="btn btn-outline btn-sm"
      >
        Lägg till bio
      </a>
    {/if}
  </article>

  <!-- Sidebar (goes all the way down) -->
  <section
    class="col-span-2 md:col-start-4 md:col-end-6 md:row-start-1 md:row-end-13"
  >
    <div class="hidden md:flex md:justify-end">
      <EditButton bind:isEditing />
    </div>
    <div class="flex flex-col">
      <HeldPositions mandates={data.member.mandates} />
      {#if data.publishedArticles.length > 0}
        <PublishedArticles articles={data.publishedArticles} />
      {/if}
      {#if publishedEvents.length > 0}
        <PublishedEvents events={data.member.authoredEvents} />
      {/if}
    </div>
  </section>

  {#if data.doorAccess.length > 0}
    <section
      class="col-span-2 md:col-start-1 md:col-end-4 md:row-start-3 lg:col-end-3"
    >
      <DoorAccess doorAccess={data.doorAccess} />
    </section>
  {/if}
</article>
