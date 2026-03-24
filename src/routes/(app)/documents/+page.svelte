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

  let { data }: { data: PageData } = $props();

  let isEditing = $state(false);

  let generateLink = $derived((field: string, value: string) => {
    const searchParams = new SvelteURLSearchParams(page.url.searchParams);
    searchParams.set(field, value.toString());
    return `?${searchParams.toString()}`;
  });

  let meetings = $derived(
    Object.keys(data.meetings).sort((a, b) =>
      page.url.searchParams.get("type") === "board-meeting" ||
      page.url.searchParams.get("type") === "SRD-meeting"
        ? b.localeCompare(a, "sv")
        : a.localeCompare(b, "sv"),
    ),
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
  <div class="flex flex-row justify-between gap-8 *:w-full">
    <div class="flex flex-col gap-2 rounded-md border-[1px] p-4">
      <h3>Sektionsmöten</h3>
      <p class="mt-0">
        Sektionsmöten hålls ungefär fyra gånger om året och är sektionens högsta
        beslutande organ. På sektionsmöten tas större beslut, som om budget,
        styrdokument och val av styrelsen. Alla medlemmar har rösträtt på
        sektionsmöten.
      </p>
    </div>

    <div class="flex flex-col gap-2 rounded-md border-[1px] p-4">
      <h3>Styrelsemöten</h3>
      <p class="mt-0">
        Styrelsemöten hålls på tisdag lunch varje läsvecka i E:1124. Här tas
        beslut om t.ex. riktlinjer och val av funktionärer. Alla medlemmar är
        välkomna att närvara och prata, men endast styrelsen har rösträtt.
      </p>
    </div>

    <div class="flex flex-col gap-2 rounded-md border-[1px] p-4">
      <h3>SRD-möten</h3>
      <p class="mt-0">
        Studierådsmöten hålls varje onsdag under läsveckorna i E:1123. Här är
        alla medlemmar välkomna att diskutera utbildningen och tycka till kring
        t.ex. hur kurserna fungerar.
      </p>
    </div>
  </div>

  <div class="mt-4 flex flex-row gap-8">
    <Tabs.Root value={page.url.searchParams.get("type") ?? "board-meeting"}>
      <Tabs.List>
        <a href={generateLink("type", "guild-meeting")}>
          <Tabs.Trigger value="guild-meeting">Sektionsmöten</Tabs.Trigger></a
        >
        <a href={generateLink("type", "board-meeting")}
          ><Tabs.Trigger value="board-meeting">Styrelsemöten</Tabs.Trigger></a
        >
        <a href={generateLink("type", "SRD-meeting")}
          ><Tabs.Trigger value="SRD-meeting">SRD-möten</Tabs.Trigger></a
        >
      </Tabs.List>
    </Tabs.Root>

    <Tabs.Root
      class="border-box overflow-y-scroll"
      value={page.url.searchParams.get("year") ?? "2026"}
    >
      <Tabs.List>
        {#each Array.from({ length: new Date().getFullYear() - 1982 + 1 }, (value, index) => 1982 + index).toReversed() as n (n)}
          <a href={generateLink("year", n + "")}>
            <Tabs.Trigger value={"" + n}>{n}</Tabs.Trigger></a
          >
        {/each}
      </Tabs.List>
    </Tabs.Root>
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
