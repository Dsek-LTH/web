<script lang="ts">
  import { invalidate } from "$app/navigation";
  import { enhance } from "$app/forms";
  import { onMount } from "svelte";
  import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    CardDescription,
  } from "$lib/components/ui/card/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Badge } from "$lib/components/ui/badge/index.js";
  import { Progress } from "$lib/components/ui/progress/index.js";
  import { Spinner } from "$lib/components/ui/spinner";
  import { signIn } from "$lib/utils/auth";
  import * as m from "$paraglide/messages";
  import {
    ticketStatusLabel,
    ticketStatusBadgeVariant,
  } from "$lib/utils/ticketRelease";
  import TicketIcon from "@lucide/svelte/icons/ticket";
  import Users from "@lucide/svelte/icons/users";
  import Hourglass from "@lucide/svelte/icons/hourglass";
  import DoorOpen from "@lucide/svelte/icons/door-open";

  let { data, form } = $props();

  const POLL_INTERVAL_MS = 5000;
  let submitting = $state(false);

  // Local 1s tick for the accept-by countdown, decoupled from the network
  // poll below - the number on screen updates every second without a
  // roundtrip, the poll only exists to catch state changes (promotion,
  // expiry, someone else's cancellation freeing a slot, ...).
  let nowMs = $state(Date.now());

  onMount(() => {
    const tick = setInterval(() => {
      nowMs = Date.now();
    }, 1000);
    const poll = setInterval(() => {
      if (!submitting) invalidate("ticket:status");
    }, POLL_INTERVAL_MS);
    return () => {
      clearInterval(tick);
      clearInterval(poll);
    };
  });

  const secondsLeft = $derived.by(() => {
    if (!data.status?.offerExpiresAt) return null;
    const ms = new Date(data.status.offerExpiresAt).getTime() - nowMs;
    return Math.max(0, Math.ceil(ms / 1000));
  });

  const releaseIsOpen = $derived(new Date(data.release.opensAt) <= new Date());
  const releaseIsClosed = $derived(
    new Date(data.release.closesAt) <= new Date(),
  );

  const submitAction = () => {
    submitting = true;
    return async ({ update }: { update: () => Promise<void> }) => {
      submitting = false;
      await update();
    };
  };
</script>

<div class="mx-auto w-full max-w-2xl px-4 py-8">
  <Card class="border-border overflow-hidden p-0 shadow-xl">
    <CardHeader class="bg-muted/50 border-border border-b-[1px] pt-6 pb-6">
      <div class="flex items-start justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="bg-lila-background/15 rounded-full p-2">
            <TicketIcon class="text-lila-background h-6 w-6" />
          </div>
          <CardTitle class="text-3xl font-bold">
            {data.release.title}
          </CardTitle>
        </div>
      </div>
      {#if data.release.location}
        <p class="text-muted-foreground flex items-center gap-1.5 pt-1">
          <DoorOpen class="h-4 w-4" />
          {data.release.location}
        </p>
      {/if}
      {#if data.release.description}
        <CardDescription class="pt-2 text-base">
          {data.release.description}
        </CardDescription>
      {/if}
    </CardHeader>
    <CardContent class="flex flex-col gap-6 pt-6 pb-6">
      <div class="flex flex-col gap-2">
        <Progress value={data.release.claimed} max={data.release.quantity} />
        <div
          class="text-muted-foreground flex items-center justify-between text-sm"
        >
          <span>
            {m.ticketRelease_detail_claimed({
              claimed: data.release.claimed,
              quantity: data.release.quantity,
            })}
          </span>
          {#if data.release.waitlisted > 0}
            <span class="flex items-center gap-1">
              <Users class="h-3.5 w-3.5" />
              {m.ticketRelease_detail_waitlisted({
                count: data.release.waitlisted,
              })}
            </span>
          {/if}
        </div>
      </div>

      {#if form?.message}
        <p class="text-destructive text-sm font-medium">
          {m.ticketRelease_detail_requestError({ error: form.message })}
        </p>
      {/if}

      {#if !data.loggedIn}
        <div class="flex flex-col items-start gap-3">
          <p>{m.ticketRelease_detail_signInRequired()}</p>
          <Button onclick={() => signIn()}>
            {m.ticketRelease_detail_signIn()}
          </Button>
        </div>
      {:else if !releaseIsOpen}
        <p class="flex items-center gap-2">
          <Hourglass class="h-4 w-4" />
          {m.ticketRelease_detail_opensAtFuture({
            date: new Date(data.release.opensAt).toLocaleString("sv-SE"),
          })}
        </p>
      {:else if !data.status || data.status.status === "cancelled" || data.status.status === "expired"}
        {#if releaseIsClosed}
          <p class="text-muted-foreground">
            {m.ticketRelease_detail_closed()}
          </p>
        {:else}
          <form method="POST" action="?/request" use:enhance={submitAction}>
            <Button type="submit" disabled={submitting} class="gap-2">
              {#if submitting}
                <Spinner class="h-4 w-4" />
              {:else}
                <TicketIcon class="h-4 w-4" />
                {m.ticketRelease_detail_request()}
              {/if}
            </Button>
          </form>
        {/if}
      {:else}
        <div class="flex flex-col gap-4">
          <Badge variant={ticketStatusBadgeVariant(data.status.status)}
            class="w-fit">
            {ticketStatusLabel(data.status.status)}
          </Badge>

          {#if data.status.status === "waitlisted" && data.status.queuePosition !== undefined}
            <p>
              {m.ticketRelease_detail_position({
                position: data.status.queuePosition + 1,
              })}
            </p>
          {/if}

          {#if data.status.status === "granted" && secondsLeft !== null}
            <p class="flex items-center gap-2">
              <Hourglass class="h-4 w-4" />
              {m.ticketRelease_detail_acceptDeadline({
                seconds: secondsLeft,
              })}
            </p>
            <form method="POST" action="?/accept" use:enhance={submitAction}>
              <Button type="submit" disabled={submitting} class="gap-2">
                {#if submitting}
                  <Spinner class="h-4 w-4" />
                {:else}
                  {m.ticketRelease_detail_accept()}
                {/if}
              </Button>
            </form>
          {/if}

          {#if data.status.status === "pending" || data.status.status === "waitlisted" || data.status.status === "granted"}
            <form method="POST" action="?/cancel" use:enhance={submitAction}>
              <Button
                type="submit"
                variant="outline"
                disabled={submitting}
              >
                {m.ticketRelease_detail_cancel()}
              </Button>
            </form>
          {/if}
        </div>
      {/if}
    </CardContent>
  </Card>
</div>
