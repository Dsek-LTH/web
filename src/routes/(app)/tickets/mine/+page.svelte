<script lang="ts">
  import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
  } from "$lib/components/ui/card/index.js";
  import { Badge } from "$lib/components/ui/badge/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import * as m from "$paraglide/messages";
  import ArrowLeft from "@lucide/svelte/icons/arrow-left";
  import {
    ticketStatusLabel,
    ticketStatusBadgeVariant,
  } from "$lib/utils/ticketRelease";

  let { data } = $props();
</script>

<div class="mx-auto w-full max-w-2xl px-4 py-8">
  <Button variant="ghost" href="/tickets" class="mb-6 flex items-center gap-2">
    <ArrowLeft class="h-4 w-4" />
    {m.ticketRelease_back()}
  </Button>

  <h1 class="mb-6 text-3xl font-bold">{m.ticketRelease_mine_title()}</h1>

  {#if data.tickets.length === 0}
    <p class="text-muted-foreground">{m.ticketRelease_mine_empty()}</p>
  {:else}
    <div class="flex flex-col gap-4">
      {#each data.tickets as ticket (ticket.releaseId)}
        <a href="/tickets/{ticket.releaseId}" class="block">
          <Card
            class="hover:border-lila-background/50 w-full transition-colors"
          >
            <CardHeader>
              <div class="flex items-center justify-between gap-4">
                <CardTitle class="text-xl">{ticket.releaseTitle}</CardTitle>
                <Badge variant={ticketStatusBadgeVariant(ticket.status)}>
                  {ticketStatusLabel(ticket.status)}
                </Badge>
              </div>
              {#if ticket.status === "waitlisted" && ticket.queuePosition !== undefined}
                <CardDescription>
                  {m.ticketRelease_mine_position({
                    position: ticket.queuePosition + 1,
                  })}
                </CardDescription>
              {/if}
            </CardHeader>
          </Card>
        </a>
      {/each}
    </div>
  {/if}
</div>
