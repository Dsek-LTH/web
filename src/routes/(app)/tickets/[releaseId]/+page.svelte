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
    formatTicketDate,
    isSoldOut,
  } from "$lib/utils/ticketRelease";
  import TicketIcon from "@lucide/svelte/icons/ticket";
  import Users from "@lucide/svelte/icons/users";
  import Hourglass from "@lucide/svelte/icons/hourglass";
  import DoorOpen from "@lucide/svelte/icons/door-open";
  import Settings from "@lucide/svelte/icons/settings";

  let { data, form } = $props();

  const POLL_INTERVAL_MS = 5000;
  let submitting = $state(false);

  // Local 1s tick for the opening and accept-by countdowns, decoupled from
  // the network poll below - the numbers on screen update every second
  // without a roundtrip, the poll only exists to catch state changes
  // (promotion, expiry, someone else's cancellation freeing a slot, ...).
  let nowMs = $state(Date.now());

  onMount(() => {
    const tick = setInterval(() => {
      nowMs = Date.now();
    }, 1000);
    const poll = setInterval(() => {
      if (submitting || !shouldPoll || document.visibilityState !== "visible")
        return;
      invalidate("ticket:status");
    }, POLL_INTERVAL_MS);
    return () => {
      clearInterval(tick);
      clearInterval(poll);
    };
  });

  // How far this device's clock is behind the server's, re-measured on every
  // load. Network latency makes it slightly underestimate, so the request
  // button appears a moment late rather than before the server accepts it.
  const clockOffsetMs = $derived(data.serverNow - Date.now());
  const serverNowMs = $derived(nowMs + clockOffsetMs);

  const secondsLeft = $derived.by(() => {
    if (!data.status?.offerExpiresAt) return null;
    const ms = new Date(data.status.offerExpiresAt).getTime() - serverNowMs;
    return Math.max(0, Math.ceil(ms / 1000));
  });

  const msUntilOpen = $derived(
    new Date(data.release.opensAt).getTime() - serverNowMs,
  );
  const releaseIsOpen = $derived(msUntilOpen <= 0);
  const releaseIsClosed = $derived(
    new Date(data.release.closesAt).getTime() <= serverNowMs,
  );

  // Nothing changes long before opening, and once closed only a member still
  // holding a live entry can see it move (promotion, offer expiry).
  const hasLiveEntry = $derived(
    data.status?.status === "pending" ||
      data.status?.status === "waitlisted" ||
      data.status?.status === "granted",
  );
  const shouldPoll = $derived(
    msUntilOpen <= POLL_INTERVAL_MS && (!releaseIsClosed || hasLiveEntry),
  );

  const soldOut = $derived(isSoldOut(data.release));

  const formatCountdown = (ms: number) => {
    const totalSeconds = Math.ceil(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const pad = (n: number) => String(n).padStart(2, "0");
    return hours > 0
      ? `${hours}:${pad(minutes)}:${pad(seconds)}`
      : `${minutes}:${pad(seconds)}`;
  };

  // Live countdown for the last day before opening, so there's no reason to
  // keep reloading the page - the request button appears on its own.
  const opensInCountdown = $derived(
    releaseIsOpen || msUntilOpen > 24 * 60 * 60 * 1000
      ? null
      : formatCountdown(msUntilOpen),
  );

  // Once open, everyone who signs up within the grace window is pooled and
  // the lottery runs when it ends. Hidden once it's due - the poll picks up
  // the "lottery_done" status shortly after.
  const msUntilLottery = $derived(
    new Date(data.release.lotteryAt).getTime() - serverNowMs,
  );
  const lotteryCountdown = $derived(
    releaseIsOpen && data.release.status === "scheduled" && msUntilLottery > 0
      ? formatCountdown(msUntilLottery)
      : null,
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
        {#if data.canManage}
          <Button
            variant="outline"
            size="sm"
            href="/admin/tickets/{data.release.id}"
            class="shrink-0 gap-2"
          >
            <Settings class="h-4 w-4" />
            {m.ticketRelease_detail_manage()}
          </Button>
        {/if}
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
          <span class="flex items-center gap-2">
            {m.ticketRelease_detail_claimed({
              claimed: data.release.claimed,
              quantity: data.release.quantity,
            })}
            {#if soldOut}
              <Badge variant="rosa">{m.ticketRelease_soldOut()}</Badge>
            {/if}
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

      {#if lotteryCountdown}
        <div class="flex flex-col gap-1">
          <p class="text-2xl font-semibold tabular-nums">
            {m.ticketRelease_detail_lotteryIn({ countdown: lotteryCountdown })}
          </p>
          <p class="text-muted-foreground text-sm">
            {m.ticketRelease_detail_lotteryExplanation()}
          </p>
        </div>
      {/if}

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
        <div class="flex flex-col gap-1">
          <p class="flex items-center gap-2">
            <Hourglass class="h-4 w-4" />
            {m.ticketRelease_detail_opensAtFuture({
              date: formatTicketDate(data.release.opensAt),
            })}
          </p>
          {#if opensInCountdown}
            <p class="text-2xl font-semibold tabular-nums">
              {m.ticketRelease_detail_opensIn({
                countdown: opensInCountdown,
              })}
            </p>
          {/if}
        </div>
      {:else if !data.status || data.status.status === "cancelled" || data.status.status === "expired"}
        {#if releaseIsClosed}
          <p class="text-muted-foreground">
            {m.ticketRelease_detail_closed()}
          </p>
        {:else}
          <div class="flex flex-col items-start gap-3">
            {#if soldOut}
              <p>{m.ticketRelease_detail_soldOut()}</p>
            {/if}
            <form method="POST" action="?/request" use:enhance={submitAction}>
              <Button type="submit" disabled={submitting} class="gap-2">
                {#if submitting}
                  <Spinner class="h-4 w-4" />
                {:else if soldOut}
                  <Users class="h-4 w-4" />
                  {m.ticketRelease_detail_joinWaitlist()}
                {:else}
                  <TicketIcon class="h-4 w-4" />
                  {m.ticketRelease_detail_request()}
                {/if}
              </Button>
            </form>
          </div>
        {/if}
      {:else}
        <div class="flex flex-col gap-4">
          <Badge
            variant={ticketStatusBadgeVariant(data.status.status)}
            class="w-fit"
          >
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
              <Button type="submit" variant="outline" disabled={submitting}>
                {m.ticketRelease_detail_cancel()}
              </Button>
            </form>
          {/if}
        </div>
      {/if}
    </CardContent>
  </Card>
</div>
