<script lang="ts">
  import * as Tabs from "$lib/components/ui/tabs";
  import { page } from "$app/state";
  import { SvelteURLSearchParams } from "svelte/reactivity";
  import Meeting from "./Meeting.svelte";
  import type { PageData } from "./$types";
  import { PUBLIC_BUCKETS_DOCUMENTS, PUBLIC_BUCKETS_FILES } from "$env/static/public";
  import apiNames from "$lib/utils/apiNames";
  import { DocumentTypes as dt } from "./types";

  import * as m from "$paraglide/messages";
  import { Button } from "$lib/components/ui/button";
  import YearSelector from "$lib/components/YearSelector.svelte";

  let { data }: { data: PageData } = $props();

  let isEditing = $state(false);

  function generateLink(value: string) {
    const searchParams = new SvelteURLSearchParams(page.url.searchParams);
    searchParams.set("type", value);
    return `?${searchParams.toString()}`;
  }

  let type = $derived(page.url.searchParams.get("type") ?? dt.boardMeeting);

  // Sort order stays a display-only concern (not authorization/validation,
  // so Principle #5 doesn't apply) - ported verbatim from the old
  // Object.keys(data.meetings).sort(...), now operating on
  // Meeting[]/.name instead of the old Record<string, FileData[]>'s keys.
  let meetings = $derived(
    [...data.meetings].sort((a, b) => {
      if (type === dt.boardMeeting) {
        return b.name.localeCompare(a.name, "sv");
      } else if (type === dt.SRDMeeting && a.name.startsWith("SRD")) {
        return (
          // Current format
          Number.parseInt(b.name.split("SRD")[1] ?? "0") -
          Number.parseInt(a.name.split("SRD")[1] ?? "0")
        );
      } else if (type === dt.SRDMeeting) {
        return ("T" + a.name).localeCompare(b.name, "sv"); // Sort other SRD meetings below current format
      } else {
        return a.name.localeCompare(b.name, "sv");
      }
    }),
  );

  // Flat policy-list reads (see governing-documents' list page precedent),
  // not the isAuthorized()/getDerivedRoles-style per-resource
  // recomputation DESIGN.md's Principle #5 rules out. Delete's bucket -
  // and therefore its policy - depends on the active tab, mirroring
  // backend/internal/documents.Service.deleteTarget exactly (SRD lives in
  // the files bucket, every other tab in documents).
  let canCreate = $derived(
    data.user?.policies?.includes(
      apiNames.FILES.BUCKET(PUBLIC_BUCKETS_DOCUMENTS).CREATE,
    ) ?? false,
  );
  let deleteBucket = $derived(
    type === dt.SRDMeeting ? PUBLIC_BUCKETS_FILES : PUBLIC_BUCKETS_DOCUMENTS,
  );
  let canDelete = $derived(
    data.user?.policies?.includes(apiNames.FILES.BUCKET(deleteBucket).DELETE) ??
      false,
  );
  let canEdit = $derived(canDelete);
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

  <div class="mt-4 flex flex-row items-center justify-between gap-8">
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
    {#each meetings as meeting (meeting.name)}
      <Meeting {meeting} {type} {isEditing} {canDelete} />
    {/each}
  </div>
</div>
