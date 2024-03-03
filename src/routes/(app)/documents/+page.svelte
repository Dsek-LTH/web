<script lang="ts">
  import { PUBLIC_BUCKETS_DOCUMENTS } from "$env/static/public";
  import Pagination from "$lib/components/Pagination.svelte";
  import Tabs from "./Tabs.svelte";
  import apiNames from "$lib/utils/apiNames";
  import type { DocumentType } from "./+page.server";
  import Meeting from "./Meeting.svelte";
  import { isAuthorized } from "$lib/utils/authorization";

  import type { PageData } from "./$types";
  export let data: PageData;

  let isEditing: boolean = false;

  const currentYear = new Date().getFullYear();
  let type: string = "board-meeting";
  const typeOptions: { name: string; value: DocumentType }[] = [
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
</script>

<svelte:head>
  <title>Dokument | D-sektionen</title>
</svelte:head>

<div class="flex flex-row flex-wrap justify-between">
  <div class="mb-4 flex w-full flex-col items-start gap-2">
    <span class="text-lg">Filtrera efter år</span>
    <Pagination
      class="max-w-prose"
      count={currentYear - 1981}
      getPageName={(pageNumber) => (currentYear - pageNumber).toString()}
      getPageNumber={(pageName) => currentYear - +pageName}
      fieldName="year"
    />
    <span class="text-lg">Filtrera efter dokumenttyp</span>
    <Tabs options={typeOptions} bind:currentTab={type} fieldName="type" />
  </div>
  <div class="flex flex-col gap-1">
    {#if isAuthorized(apiNames.FILES.BUCKET(PUBLIC_BUCKETS_DOCUMENTS).CREATE, data.user)}
      <a class="btn btn-primary btn-sm" href="/documents/upload"
        >Ladda upp fil</a
      >
    {/if}
    {#if isAuthorized(apiNames.FILES.BUCKET(PUBLIC_BUCKETS_DOCUMENTS).DELETE, data.user)}
      <button
        class="btn btn-secondary btn-sm"
        on:click={() => {
          isEditing = !isEditing;
        }}
      >
        {isEditing ? "Sluta redigera" : "Redigera"}
      </button>
    {/if}
  </div>
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
