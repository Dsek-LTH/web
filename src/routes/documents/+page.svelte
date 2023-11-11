<script lang="ts">
  import Pagination from "$lib/components/Pagination.svelte";
  import Tabs from "$lib/components/Tabs.svelte";
  import apiNames from "$lib/utils/apiNames";
  import type { DocumentType } from "./+page.server";
  import Meeting from "./Meeting.svelte";

  export let data;

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
      name: "Other",
      value: "other",
    },
  ];
  $: meetings = Object.keys(data.meetings).sort((a, b) =>
    type === "board-meeting" ? b.localeCompare(a, "sv") : a.localeCompare(b, "sv")
  );
</script>

<svelte:head>
  <title>Dokument | D-sektionen</title>
</svelte:head>

<div class="flex flex-row justify-between">
  <div class="mb-4 flex flex-col items-start gap-2">
    <a href="/documents/governing">Styrdokument</a>
    <span class="text-lg">Filtrera efter år</span>
    <Pagination
      pages={currentYear - 1981}
      getNumber={(n) => currentYear - n + 1}
      reverseGetNumber={(n) => -n + 1 + currentYear}
      fieldName="year"
    />
    <span class="text-lg">Filtrera efter dokumenttyp</span>
    <Tabs options={typeOptions} bind:currentTab={type} fieldName="type" />
  </div>
  <div class="flex flex-col gap-1">
    {#if data.accessPolicies.includes(apiNames.FILES.BUCKET("dev-documents").CREATE)}
      <a class="btn btn-primary btn-sm" href="/documents/upload">Ladda upp fil</a>
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
    <Meeting name={meeting} files={data.meetings[meeting] ?? []} {isEditing} />
  {/each}
</div>
