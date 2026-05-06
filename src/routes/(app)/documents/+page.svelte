<script lang="ts">
  import { PUBLIC_BUCKETS_DOCUMENTS } from "$env/static/public";
  import Pagination from "$lib/components/Pagination.svelte";
  import Tabs from "./Tabs.svelte";
  import apiNames from "$lib/utils/apiNames";
  import type { DocumentType } from "./+page.server";
  import Meeting from "./Meeting.svelte";
  import { isAuthorized } from "$lib/utils/authorization";
  import * as m from "$paraglide/messages";

  import type { PageData } from "./$types";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  export let data: PageData;
  import { documentTypes, documentTypes as dt } from "./types";

  let isEditing = false;

  const currentYear = new Date().getFullYear();
  let type: documentTypes = dt.boardMeeting;
  const typeOptions: Array<{ name: string; value: DocumentType }> = [
    {
      name: m.documents_guildMeetings(),
      value: dt.guildMeeting,
    },
    {
      name: m.documents_boardMeetings(),
      value: dt.boardMeeting,
    },
    {
      name: m.documents_srdMeetings(),
      value: dt.SRDMeeting,
    },
    {
      name: m.documents_other(),
      value: dt.other,
    },
  ];
  $: meetings = Object.keys(data.meetings).sort((a, b) => {
    if (type === dt.boardMeeting) {
      return b.localeCompare(a, "sv");
    } else if (type === dt.SRDMeeting && a.startsWith("SRD")) {
      return (
        // Current format
        Number.parseInt(b.split("SRD")[1] ?? "0") -
        Number.parseInt(a.split("SRD")[1] ?? "0")
      );
    } else if (type === dt.SRDMeeting) {
      return ("T" + a).localeCompare(b, "sv"); // Sort other SRD meetings below current format
    } else {
      return a.localeCompare(b, "sv");
    }
  });
  $: canCreate = isAuthorized(
    apiNames.FILES.BUCKET(PUBLIC_BUCKETS_DOCUMENTS).CREATE,
    data.user,
  );
  $: canEdit = isAuthorized(
    apiNames.FILES.BUCKET(PUBLIC_BUCKETS_DOCUMENTS).DELETE,
    data.user,
  );
</script>

<SetPageTitle title={m.documents()} />

<div class="flex flex-row flex-wrap justify-between">
  <div class="mb-4 flex w-full flex-col items-start gap-2">
    <span class="text-lg">{m.documents_filterByYear()}</span>
    <Pagination
      class="max-w-prose"
      count={currentYear - 1981}
      getPageName={(pageNumber) => (currentYear - pageNumber).toString()}
      getPageNumber={(pageName) => currentYear - +pageName}
      fieldName="year"
    />
    <span class="text-lg">{m.documents_filterByType()}</span>
    <Tabs options={typeOptions} bind:currentTab={type} fieldName="type" />
  </div>

  {#if canCreate || canEdit}
    <div class="mb-4 flex flex-row gap-1">
      {#if canCreate}
        <a class="btn btn-primary btn-sm" href="/documents/upload"
          >{m.documents_uploadFile()}</a
        >
      {/if}
      {#if canEdit}
        <button
          class="btn btn-secondary btn-sm"
          on:click={() => {
            isEditing = !isEditing;
          }}
        >
          {isEditing ? m.documents_stopEditing() : m.documents_edit()}
        </button>
      {/if}
    </div>
  {/if}
</div>

<div class="flex flex-col gap-4">
  {#each meetings as meeting (meeting)}
    <Meeting
      name={meeting}
      files={data.meetings[meeting] ?? []}
      {isEditing}
      deleteForm={data.deleteForm}
    />
  {/each}
</div>
