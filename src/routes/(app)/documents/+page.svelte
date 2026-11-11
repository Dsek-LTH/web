<script lang="ts">
  import * as Tabs from "$lib/components/ui/tabs";
  import { page } from "$app/state";
  import { prefersReducedMotion } from "svelte/motion";
  import { MediaQuery, SvelteURLSearchParams } from "svelte/reactivity";
  import { fly, slide } from "svelte/transition";
  import type { PageData } from "./$types";
  import {
    PUBLIC_BUCKETS_DOCUMENTS,
    PUBLIC_BUCKETS_FILES,
  } from "$env/static/public";
  import { isAuthorized } from "$lib/utils/authorization";
  import apiNames from "$lib/utils/apiNames";
  import * as m from "$paraglide/messages";
  import { Button } from "$lib/components/ui/button";
  import Input from "$lib/components/ui/input/input.svelte";
  import YearSelector from "$lib/components/YearSelector.svelte";
  import ArrowUpRight from "@lucide/svelte/icons/arrow-up-right";
  import Search from "@lucide/svelte/icons/search";
  import MeetingRow from "./MeetingRow.svelte";
  import MeetingDetail from "./MeetingDetail.svelte";

  let { data }: { data: PageData } = $props();

  const isDesktop = new MediaQuery("(min-width: 768px)", false);

  let isEditing = $state(false);
  let query = $state("");
  let selectedMeeting = $state<string | null>(null);
  let lastListScope = $state<string | null>(null);
  let lastListKey = $state("");

  let type = $derived(page.url.searchParams.get("type"));
  let year = $derived(page.url.searchParams.get("year"));
  // Changing year or tab should select the newest meeting again, while
  // filtering the list should keep the current selection when possible.
  let listScope = $derived(`${year ?? ""}|${type ?? ""}`);

  let sortedMeetings = $derived.by(() => {
    const meetings = [...data.meetings].sort((a, b) => {
      if (type === "board-meeting" || type === null) {
        return b.name.localeCompare(a.name, "sv");
      } else if (type === "SRD-meeting" && a.name.startsWith("SRD")) {
        return (
          Number.parseInt(b.name.split("SRD")[1] ?? "0") -
          Number.parseInt(a.name.split("SRD")[1] ?? "0")
        );
      } else if (type === "SRD-meeting") {
        return ("T" + a.name).localeCompare(b.name, "sv");
      } else {
        return a.name.localeCompare(b.name, "sv");
      }
    });

    const search = query.trim().toLowerCase();
    return search
      ? meetings.filter((meeting) =>
          meeting.name.toLowerCase().includes(search),
        )
      : meetings;
  });

  let listKey = $derived(
    sortedMeetings.map((meeting) => meeting.name).join("|"),
  );

  $effect(() => {
    if (listScope === lastListScope && listKey === lastListKey) return;

    const scopeChanged = listScope !== lastListScope;
    lastListScope = listScope;
    lastListKey = listKey;

    if (
      scopeChanged ||
      !sortedMeetings.some((meeting) => meeting.name === selectedMeeting)
    ) {
      selectedMeeting = sortedMeetings[0]?.name ?? null;
    }
  });

  let selected = $derived(
    sortedMeetings.find((meeting) => meeting.name === selectedMeeting) ?? null,
  );

  let typeProse = $derived.by(() => {
    switch (type) {
      case "guild-meeting":
        return m.documents_guildMeetings_prose();
      case "SRD-meeting":
        return m.documents_srdMeetings_prose();
      default:
        return m.documents_boardMeetings_prose();
    }
  });

  function generateLink(value: string) {
    const searchParams = new SvelteURLSearchParams(page.url.searchParams);
    searchParams.set("type", value);
    return `?${searchParams.toString()}`;
  }

  function selectMeeting(name: string) {
    selectedMeeting = selectedMeeting === name ? null : name;
  }

  let canCreate = $derived(
    isAuthorized(
      apiNames.FILES.BUCKET(PUBLIC_BUCKETS_DOCUMENTS).CREATE,
      data.user,
    ),
  );
  let canDelete = $derived(
    isAuthorized(
      apiNames.FILES.BUCKET(PUBLIC_BUCKETS_DOCUMENTS).DELETE,
      data.user,
    ) ||
      isAuthorized(
        apiNames.FILES.BUCKET(PUBLIC_BUCKETS_FILES).DELETE,
        data.user,
      ),
  );
  let canUpdate = $derived(
    isAuthorized(
      apiNames.FILES.BUCKET(PUBLIC_BUCKETS_DOCUMENTS).UPDATE,
      data.user,
    ) ||
      isAuthorized(
        apiNames.FILES.BUCKET(PUBLIC_BUCKETS_FILES).UPDATE,
        data.user,
      ),
  );
  let canEdit = $derived(canDelete || canUpdate);
</script>

<div class="layout-container">
  <p class="text-muted-foreground max-w-3xl text-sm">{typeProse}</p>

  {#if data.loadError}
    <p class="text-destructive mt-2 text-sm">
      {m.documents_errors_loadFailed()}
    </p>
  {/if}

  <div class="mt-4 flex flex-col gap-3">
    <div
      class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
    >
      <div
        class="flex flex-col items-start gap-3 md:flex-row md:items-stretch md:gap-2"
      >
        <Tabs.Root value={page.url.searchParams.get("type") ?? "board-meeting"}>
          <Tabs.List class="max-w-full flex-row px-1">
            <a href={generateLink("guild-meeting")}>
              <Tabs.Trigger
                value="guild-meeting"
                class="px-2 text-xs sm:px-3 sm:text-sm"
                >{m.documents_guildMeetings()}</Tabs.Trigger
              ></a
            >
            <a href={generateLink("board-meeting")}
              ><Tabs.Trigger
                value="board-meeting"
                class="px-2 text-xs sm:px-3 sm:text-sm"
                >{m.documents_boardMeetings()}</Tabs.Trigger
              ></a
            >
            <a href={generateLink("SRD-meeting")}
              ><Tabs.Trigger
                value="SRD-meeting"
                class="px-2 text-xs sm:px-3 sm:text-sm"
                >{m.documents_srdMeetings()}</Tabs.Trigger
              ></a
            >
          </Tabs.List>
        </Tabs.Root>
        <Button href="/documents/governing" variant="outline" class="md:h-full">
          {m.documents_governing()}
          <ArrowUpRight />
        </Button>
      </div>

      <YearSelector />
    </div>

    <div
      class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between"
    >
      <div class="w-full md:w-64">
        <Input
          bind:value={query}
          placeholder={m.documents_searchMeetings()}
          aria-label={m.documents_searchMeetings()}
        >
          <Search class="size-4" />
        </Input>
      </div>

      {#if canCreate || canEdit}
        <div class="flex flex-row gap-2">
          {#if canCreate}
            <Button href="/documents/upload" variant="rosa" size="sm"
              >{m.documents_uploadFile()}</Button
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
    </div>
  </div>

  <div class="mt-4 flex flex-col gap-4 md:flex-row md:items-start">
    <div class="flex w-full flex-col gap-2 md:w-fit md:max-w-full md:shrink-0">
      {#if sortedMeetings.length === 0}
        <p class="text-muted-foreground text-sm">
          {m.documents_errors_noFiles()}
        </p>
      {:else}
        {#each sortedMeetings as meeting (meeting.name)}
          <div class="w-full">
            <MeetingRow
              {meeting}
              selected={selectedMeeting === meeting.name}
              onSelect={() => selectMeeting(meeting.name)}
            />

            {#if !isDesktop.current && selectedMeeting === meeting.name && selected}
              <div
                class="md:hidden"
                transition:slide={{
                  duration: prefersReducedMotion.current ? 0 : 200,
                }}
              >
                <div class="pt-2">
                  <MeetingDetail
                    meeting={selected}
                    deleteForm={data.deleteForm}
                    editForm={data.editForm}
                    {isEditing}
                    {canDelete}
                    {canUpdate}
                    onClose={() => (selectedMeeting = null)}
                  />
                </div>
              </div>
            {/if}
          </div>
        {/each}
      {/if}
    </div>

    <div class="hidden min-w-0 flex-1 md:block">
      {#if isDesktop.current}
        {#key selected?.name ?? "empty"}
          <div
            in:fly={{
              y: prefersReducedMotion.current ? 0 : 4,
              duration: prefersReducedMotion.current ? 0 : 160,
            }}
          >
            <MeetingDetail
              meeting={selected}
              deleteForm={data.deleteForm}
              editForm={data.editForm}
              {isEditing}
              {canDelete}
              {canUpdate}
              onClose={() => (selectedMeeting = null)}
            />
          </div>
        {/key}
      {/if}
    </div>
  </div>
</div>
