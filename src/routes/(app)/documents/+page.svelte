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
  export let data: PageData;

  let isEditing = false;

  const currentYear = new Date().getFullYear();
  let type = "board-meeting";
  const typeOptions: Array<{ name: string; value: DocumentType }> = [
    {
      name: "Guild Meetings",
      value: "guild-meeting",
    },
    {
      name: "Board Meetings",
      value: "board-meeting",
    },
    {
      name: "SRD Meetings",
      value: "SRD-meeting",
    },
    {
      name: "Other",
      value: "other",
    },
  ];
  $: meetings = Object.keys(data.meetings).sort((a, b) =>
    type === "board-meeting"
      ? b.localeCompare(a, "sv")
      : a.localeCompare(b, "sv"),
  );
  $: canCreate = isAuthorized(
    apiNames.FILES.BUCKET(PUBLIC_BUCKETS_DOCUMENTS).CREATE,
    data.user,
  );
  $: canEdit = isAuthorized(
    apiNames.FILES.BUCKET(PUBLIC_BUCKETS_DOCUMENTS).DELETE,
    data.user,
  );
</script>

<svelte:head>
  <title>{m.documents()} | D-sektionen</title>
</svelte:head>

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
