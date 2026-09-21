<script lang="ts">
  import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
  } from "$lib/components/ui/card/index.js";
  import { Badge } from "$lib/components/ui/badge/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Progress } from "$lib/components/ui/progress/index.js";
  import * as m from "$paraglide/messages";
  import TicketIcon from "@lucide/svelte/icons/ticket";
  import Users from "@lucide/svelte/icons/users";
  import DoorOpen from "@lucide/svelte/icons/door-open";
  import {
    releaseStatusLabel,
    releaseStatusBadgeVariant,
  } from "$lib/utils/ticketRelease";

  let { data } = $props();
</script>

<div class="mx-auto w-full max-w-2xl px-4 py-8">
  <div class="mb-6 flex items-center justify-between gap-4">
    <div class="flex items-center gap-3">
      <div class="bg-lila-background/15 rounded-full p-2">
        <TicketIcon class="text-lila-background h-6 w-6" />
      </div>
      <h1 class="text-3xl font-bold">{m.ticketRelease_list_title()}</h1>
    </div>
    <Button variant="outline" href="/tickets/mine">
      {m.ticketRelease_list_myTickets()}
    </Button>
  </div>

  {#if data.releases.length === 0}
    <p class="text-muted-foreground">{m.ticketRelease_list_empty()}</p>
  {:else}
    <div class="flex flex-col gap-4">
      {#each data.releases as release (release.id)}
        <a href="/tickets/{release.id}" class="block">
          <Card
            class="hover:border-lila-background/50 w-full gap-3 transition-colors"
          >
            <CardHeader>
              <div class="flex items-center justify-between gap-4">
                <CardTitle class="text-xl">{release.title}</CardTitle>
                <Badge variant={releaseStatusBadgeVariant(release.status)}>
                  {releaseStatusLabel(release.status)}
                </Badge>
              </div>
              {#if release.location}
                <p
                  class="text-muted-foreground flex items-center gap-1.5 text-sm"
                >
                  <DoorOpen class="h-3.5 w-3.5" />
                  {release.location}
                </p>
              {/if}
              {#if release.description}
                <CardDescription class="line-clamp-2">
                  {release.description}
                </CardDescription>
              {/if}
            </CardHeader>
            <div class="flex flex-col gap-2 px-6">
              <Progress value={release.claimed} max={release.quantity} />
              <div
                class="text-muted-foreground flex items-center justify-between text-sm"
              >
                <span>
                  {m.ticketRelease_list_claimed({
                    claimed: release.claimed,
                    quantity: release.quantity,
                  })}
                </span>
                {#if release.waitlisted > 0}
                  <span class="flex items-center gap-1">
                    <Users class="h-3.5 w-3.5" />
                    {m.ticketRelease_list_waitlisted({
                      count: release.waitlisted,
                    })}
                  </span>
                {/if}
              </div>
              <span class="text-muted-foreground text-sm">
                {m.ticketRelease_list_opensAt({
                  date: new Date(release.opensAt).toLocaleString("sv-SE"),
                })}
              </span>
            </div>
          </Card>
        </a>
      {/each}
    </div>
  {/if}
</div>
