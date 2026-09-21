<script lang="ts">
  import { Button } from "$lib/components/ui/button/index.js";
  import { Badge } from "$lib/components/ui/badge/index.js";
  import * as Table from "$lib/components/ui/table/index.js";
  import MemberAvatar from "$lib/components/member/MemberAvatar.svelte";
  import { getFullName } from "$lib/utils/client/member";
  import * as m from "$paraglide/messages";
  import ArrowLeft from "@lucide/svelte/icons/arrow-left";
  import DoorOpen from "@lucide/svelte/icons/door-open";
  import Download from "@lucide/svelte/icons/download";
  import Pencil from "@lucide/svelte/icons/pencil";
  import {
    releaseStatusLabel,
    releaseStatusBadgeVariant,
  } from "$lib/utils/ticketRelease";

  let { data } = $props();
</script>

<div class="mx-auto w-full max-w-3xl px-4 py-8">
  <Button
    variant="ghost"
    href="/admin/tickets"
    class="mb-6 flex items-center gap-2"
  >
    <ArrowLeft class="h-4 w-4" />
    {m.ticketRelease_back()}
  </Button>

  <div class="mb-6 flex items-start justify-between gap-4">
    <div>
      <div class="flex items-center gap-3">
        <h1 class="text-3xl font-bold">{data.release.title}</h1>
        <Badge variant={releaseStatusBadgeVariant(data.release.status)}>
          {releaseStatusLabel(data.release.status)}
        </Badge>
      </div>
      {#if data.release.location}
        <p class="text-muted-foreground mt-1 flex items-center gap-1.5">
          <DoorOpen class="h-4 w-4" />
          {data.release.location}
        </p>
      {/if}
    </div>
    <div class="flex shrink-0 items-center gap-2">
      <Button variant="outline" href="/admin/tickets/{data.release.id}/edit">
        <Pencil class="h-4 w-4" />
        {m.ticketRelease_admin_edit()}
      </Button>
      <Button variant="outline" href="/tickets/{data.release.id}">
        {m.ticketRelease_admin_viewPublic()}
      </Button>
    </div>
  </div>

  <div class="mb-3 flex items-center justify-between">
    <h2 class="text-xl font-semibold">
      {m.ticketRelease_admin_roster_title()}
    </h2>
    {#if data.roster.length > 0}
      <Button
        variant="outline"
        href="/admin/tickets/{data.release.id}/csv"
        class="flex items-center gap-2"
      >
        <Download class="h-4 w-4" />
        {m.ticketRelease_admin_roster_downloadCsv()}
      </Button>
    {/if}
  </div>

  {#if data.roster.length === 0}
    <p class="text-muted-foreground">
      {m.ticketRelease_admin_roster_empty()}
    </p>
  {:else}
    <div class="overflow-x-auto">
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.Head>{m.ticketRelease_admin_roster_col_name()}</Table.Head>
            <Table.Head
              >{m.ticketRelease_admin_roster_col_foodPreference()}</Table.Head
            >
            <Table.Head
              >{m.ticketRelease_admin_roster_col_requestedAt()}</Table.Head
            >
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {#each data.roster as entry (entry.memberId)}
            <Table.Row>
              <Table.Cell>
                <div class="flex items-center gap-3">
                  <MemberAvatar
                    class="h-8 w-8"
                    member={entry.member ?? {
                      picturePath: null,
                      firstName: null,
                      lastName: null,
                    }}
                  />
                  <span class="font-medium">
                    {entry.member
                      ? getFullName(entry.member)
                      : entry.memberId}
                  </span>
                </div>
              </Table.Cell>
              <Table.Cell>{entry.member?.foodPreference ?? ""}</Table.Cell>
              <Table.Cell>
                {new Date(entry.updatedAt).toLocaleString("sv-SE")}
              </Table.Cell>
            </Table.Row>
          {/each}
        </Table.Body>
      </Table.Root>
    </div>
  {/if}
</div>
