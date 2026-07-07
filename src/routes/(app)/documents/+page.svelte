<script lang="ts">
  import * as Tabs from "$lib/components/ui/tabs";
  import { page } from "$app/state";
  import { SvelteURLSearchParams } from "svelte/reactivity";
  import Meeting from "./Meeting.svelte";
  import type { PageData } from "./$types";
  import { PUBLIC_BUCKETS_DOCUMENTS } from "$env/static/public";
  import { isAuthorized } from "$lib/utils/authorization";
  import apiNames from "$lib/utils/apiNames";

  import * as m from "$paraglide/messages";
  import { Button } from "$lib/components/ui/button";
  import YearSelector from "$lib/components/YearSelector.svelte";

  let { data }: { data: PageData } = $props();

  let isEditing = $state(false);

  const generateLink = $derived((value: string) => {
    const searchParams = new SvelteURLSearchParams(page.url.searchParams);
    searchParams.set("type", value.toString());
    return `?${searchParams.toString()}`;
  });

  let type = $derived(page.url.searchParams.get("type"));

  let meetings = $derived(
    Object.keys(data.meetings).sort((a, b) => {
      if (type === "board-meeting" || type === null) {
        return b.localeCompare(a, "sv");
      } else if (type === "SRD-meeting" && a.startsWith("SRD")) {
        return (
          // Current format
          Number.parseInt(b.split("SRD")[1] ?? "0") -
          Number.parseInt(a.split("SRD")[1] ?? "0")
        );
      } else if (type === "SRD-meeting") {
        return ("T" + a).localeCompare(b, "sv"); // Sort other SRD meetings below current format
      } else {
        return a.localeCompare(b, "sv");
      }
    }),
  );

  let canCreate = $derived(
    isAuthorized(
      apiNames.FILES.BUCKET(PUBLIC_BUCKETS_DOCUMENTS).CREATE,
      data.user,
    ),
  );
  let canEdit = $derived(
    isAuthorized(
      apiNames.FILES.BUCKET(PUBLIC_BUCKETS_DOCUMENTS).DELETE,
      data.user,
    ),
  );
</script>

<div class="layout-container">
  <div
    class="flex flex-col justify-between gap-4 *:w-full md:flex-row md:gap-8"
  >
    <div class="flex flex-col gap-2 rounded-md border-[1px] p-4">
      <h3>{m.documents_guildMeetings()}</h3>
      <p class="mt-0">{m.documents_guildMeetings_prose()}</p>
    </div>

    <div class="flex flex-col gap-2 rounded-md border-[1px] p-4">
      <h3>{m.documents_boardMeetings()}</h3>
      <p class="mt-0">{m.documents_boardMeetings_prose()}</p>
    </div>

    <div class="flex flex-col gap-2 rounded-md border-[1px] p-4">
      <h3>{m.documents_srdMeetings()}</h3>
      <p class="mt-0">{m.documents_srdMeetings_prose()}</p>
    </div>
  </div>

  <div class="mt-4 flex flex-row gap-8">
    <Tabs.Root value={page.url.searchParams.get("type") ?? "board-meeting"}>
      <Tabs.List class="flex-col px-4 sm:flex-row sm:px-1">
        <a href={generateLink("guild-meeting")}>
          <Tabs.Trigger value="guild-meeting"
            >{m.documents_guildMeetings()}</Tabs.Trigger
          ></a
        >
        <a href={generateLink("board-meeting")}
          ><Tabs.Trigger value="board-meeting"
            >{m.documents_boardMeetings()}</Tabs.Trigger
          ></a
        >
        <a href={generateLink("SRD-meeting")}
          ><Tabs.Trigger value="SRD-meeting"
            >{m.documents_srdMeetings()}</Tabs.Trigger
          ></a
        >
      </Tabs.List>
    </Tabs.Root>

    <YearSelector />
  </div>

  {#if canCreate || canEdit}
    <div class="mt-2 mb-4 flex flex-row gap-2">
      {#if canCreate}
        <a href="/documents/upload"
          ><Button variant="rosa" size="sm">{m.documents_uploadFile()}</Button
          ></a
        >
      {/if}
      {#if canEdit}
        <Button
          variant="lila"
          size="sm"
          onclick={() => {
            isEditing = !isEditing;
          }}
        >
          {isEditing ? m.documents_stopEditing() : m.documents_edit()}
        </Button>
      {/if}
    </div>
  {/if}

  <div class="mt-2 flex flex-col gap-4">
    {#each meetings as meeting (meeting)}
      <Meeting
        name={meeting}
        files={data.meetings[meeting] ?? []}
        {isEditing}
        deleteForm={data.deleteForm}
      />
    {/each}
  </div>
</div>
