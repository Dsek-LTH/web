<script lang="ts">
  import { Button } from "$lib/components/ui/button/index.js";
  import { Badge } from "$lib/components/ui/badge/index.js";
  import * as Table from "$lib/components/ui/table/index.js";
  import * as m from "$paraglide/messages";
  import Plus from "@lucide/svelte/icons/plus";
  import TicketIcon from "@lucide/svelte/icons/ticket";
  import {
    releaseStatusLabel,
    releaseStatusBadgeVariant,
  } from "$lib/utils/ticketRelease";

  let { data } = $props();
</script>

<div class="mx-auto w-full max-w-4xl px-4 py-8">
  <div class="mb-6 flex items-center justify-between gap-4">
    <div class="flex items-center gap-3">
      <div class="bg-lila-background/15 rounded-full p-2">
        <TicketIcon class="text-lila-background h-6 w-6" />
      </div>
      <h1 class="text-3xl font-bold">{m.ticketRelease_admin_title()}</h1>
    </div>
    <Button href="/admin/tickets/create" class="flex items-center gap-2">
      <Plus class="h-4 w-4" />
      {m.ticketRelease_admin_new()}
    </Button>
  </div>

  {#if data.releases.length === 0}
    <p class="text-muted-foreground">{m.ticketRelease_admin_empty()}</p>
  {:else}
    <div class="overflow-x-auto">
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.Head>{m.ticketRelease_admin_col_title()}</Table.Head>
            <Table.Head>{m.ticketRelease_admin_col_opensAt()}</Table.Head>
            <Table.Head>{m.ticketRelease_admin_col_status()}</Table.Head>
            <Table.Head>{m.ticketRelease_admin_col_claimed()}</Table.Head>
            <Table.Head>{m.ticketRelease_admin_col_waitlisted()}</Table.Head>
            <Table.Head></Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {#each data.releases as release (release.id)}
            <Table.Row>
              <Table.Cell class="font-medium">{release.title}</Table.Cell>
              <Table.Cell>
                {new Date(release.opensAt).toLocaleString("sv-SE")}
              </Table.Cell>
              <Table.Cell>
                <Badge variant={releaseStatusBadgeVariant(release.status)}>
                  {releaseStatusLabel(release.status)}
                </Badge>
              </Table.Cell>
              <Table.Cell>{release.claimed} / {release.quantity}</Table.Cell>
              <Table.Cell>{release.waitlisted}</Table.Cell>
              <Table.Cell>
                <Button variant="ghost" href="/admin/tickets/{release.id}">
                  {m.ticketRelease_admin_view()}
                </Button>
              </Table.Cell>
            </Table.Row>
          {/each}
        </Table.Body>
      </Table.Root>
    </div>
  {/if}
</div>
