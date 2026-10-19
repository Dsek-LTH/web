<script lang="ts">
  import {
    ArchiveIcon,
    ArrowLeftIcon,
    CheckIcon,
    ClockIcon,
    DoorOpenIcon,
    PartyPopperIcon,
    PencilIcon,
    SkipForwardIcon,
    TriangleAlertIcon,
    UsersIcon,
    XIcon,
  } from "@lucide/svelte";
  import { SvelteSet } from "svelte/reactivity";
  import type { SubmitFunction } from "@sveltejs/kit";
  import { enhance } from "$app/forms";
  import Button from "$lib/components/ui/button/button.svelte";
  import * as Alert from "$lib/components/ui/alert/index.js";
  import MemberAvatar from "$lib/components/member/MemberAvatar.svelte";
  import { getFullName } from "$lib/utils/client/member";
  import {
    getStickyBottomOffset,
    stickyBottomClass,
  } from "$lib/bookings/stickyBottom";
  import * as m from "$paraglide/messages";
  import { getLocale } from "$paraglide/runtime";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  // Bookings decided on in this session are hidden right away, before the
  // reload confirms it, so the next one shows up without waiting.
  const handled = new SvelteSet<string>();
  const skipped = new SvelteSet<string>();
  let submitting = $state(false);
  let errorMessage = $state<string | null>(null);
  let lastDecision = $state<{ event: string; accepted: boolean } | null>(null);

  const remaining = $derived(data.queue.filter(({ id }) => !handled.has(id)));
  const booking = $derived(remaining.find(({ id }) => !skipped.has(id)));

  const stickyBottom = $derived(getStickyBottomOffset());

  const formatDate = (date: Date) =>
    date.toLocaleDateString(getLocale(), {
      timeZone: "Europe/Stockholm",
      weekday: "long",
      day: "numeric",
      month: "long",
    });

  const formatTime = (date: Date) =>
    date.toLocaleTimeString(getLocale(), {
      timeZone: "Europe/Stockholm",
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatShortDateTime = (date: Date) =>
    date.toLocaleString(getLocale(), {
      timeZone: "Europe/Stockholm",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

  const isSameDay = (a: Date, b: Date) =>
    formatDate(a) === formatDate(b) && b.getTime() - a.getTime() < 86_400_000;

  const formatDuration = (start: Date, end: Date) => {
    const minutes = Math.round((end.getTime() - start.getTime()) / 60_000);
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    if (hours >= 24) {
      return m.booking_durationDaysHours({
        days: Math.floor(hours / 24),
        hours: hours % 24,
      });
    }
    return rest
      ? m.booking_durationHoursMinutes({ hours, minutes: rest })
      : m.booking_durationHours({ hours });
  };

  const handleDecision: SubmitFunction = ({ formData, action }) => {
    const id = String(formData.get("id"));
    const event = booking?.event ?? "";
    const accepted = action.searchParams.has("/accept");
    handled.add(id);
    submitting = true;
    errorMessage = null;

    return async ({ result, update }) => {
      if (result.type === "success") {
        lastDecision = { event, accepted };
      } else {
        handled.delete(id);
        lastDecision = null;
        errorMessage = m.booking_actionFailed();
      }
      await update();
      submitting = false;
    };
  };
</script>

<div class="mx-auto flex w-full max-w-xl flex-1 flex-col px-4 pt-6 md:pt-10">
  <div class="mb-4 flex items-center justify-between gap-3">
    <Button
      variant="ghost"
      size="sm"
      href="/bookings/admin"
      class="-ml-3"
      aria-label={m.booking_goBack()}
    >
      <ArrowLeftIcon class="size-4" />
      <span class="hidden sm:inline">{m.booking_goBack()}</span>
    </Button>
    <h1 class="text-lg font-semibold uppercase">{m.booking_reviewQueue()}</h1>
    <span
      class="text-muted-foreground min-w-12 text-right text-sm tabular-nums"
    >
      {#if remaining.length > 0}
        {m.booking_reviewRemaining({ count: remaining.length })}
      {/if}
    </span>
  </div>

  {#if lastDecision}
    <p
      class={[
        "mb-3 flex items-center gap-2 text-sm",
        lastDecision.accepted ? "text-primary" : "text-destructive",
      ]}
      aria-live="polite"
    >
      {#if lastDecision.accepted}
        <CheckIcon class="size-4" />
        {m.booking_lastAccepted({ event: lastDecision.event })}
      {:else}
        <XIcon class="size-4" />
        {m.booking_lastDenied({ event: lastDecision.event })}
      {/if}
    </p>
  {/if}

  {#if errorMessage}
    <Alert.Root variant="error" class="mb-3">
      <TriangleAlertIcon />
      <Alert.Description>{errorMessage}</Alert.Description>
    </Alert.Root>
  {/if}

  {#if booking?.start && booking.end}
    {@const start = new Date(booking.start)}
    {@const end = new Date(booking.end)}
    <article class="bg-muted-background flex-1 space-y-5 rounded-xl p-5">
      <header class="space-y-3">
        <h2
          class="flex items-start gap-2 text-2xl leading-tight font-semibold break-words"
        >
          <PartyPopperIcon class="text-primary mt-1 size-5 shrink-0" />
          {booking.event}
        </h2>
        {#if booking.booker}
          <a
            href="/members/{booking.booker.studentId}"
            class="flex w-fit items-center gap-2 hover:underline"
          >
            <MemberAvatar member={booking.booker} class="size-7" />
            {getFullName(booking.booker, { hideNickname: true })}
          </a>
        {/if}
      </header>

      <section class="flex gap-3">
        <ClockIcon class="text-primary mt-0.5 size-5 shrink-0" />
        <div>
          {#if isSameDay(start, end)}
            <p class="font-medium first-letter:uppercase">
              {formatDate(start)}
            </p>
            <p class="text-xl font-semibold tabular-nums">
              {formatTime(start)} – {formatTime(end)}
            </p>
          {:else}
            <p class="font-medium first-letter:uppercase">
              {formatDate(start)}
              <span class="font-semibold tabular-nums">{formatTime(start)}</span
              >
            </p>
            <p class="font-medium first-letter:uppercase">
              – {formatDate(end)}
              <span class="font-semibold tabular-nums">{formatTime(end)}</span>
            </p>
          {/if}
          <p class="text-muted-foreground text-sm">
            {formatDuration(start, end)}
          </p>
        </div>
      </section>

      <section class="flex gap-3">
        <ArchiveIcon class="text-primary mt-0.5 size-5 shrink-0" />
        <div class="flex flex-wrap gap-2">
          {#each booking.bookables as bookable (bookable.id)}
            <span
              class="bg-primary/10 text-primary rounded-md px-2.5 py-1 text-sm font-medium"
            >
              {bookable.name}
            </span>
          {/each}
        </div>
      </section>

      {#if booking.conflicts.length > 0}
        <Alert.Root variant="error">
          <TriangleAlertIcon />
          <Alert.Title>{m.booking_conflict()}</Alert.Title>
          <Alert.Description>
            <ul class="ml-0 list-none space-y-1">
              {#each booking.conflicts as conflict (conflict.id)}
                <li>
                  {m.booking_conflictWith({
                    event: conflict.event ?? "-",
                    bookables: conflict.bookables
                      .map(({ name }) => name)
                      .join(", "),
                  })}
                  {#if conflict.start && conflict.end}
                    <span class="block text-xs opacity-80">
                      {formatShortDateTime(new Date(conflict.start))} – {formatShortDateTime(
                        new Date(conflict.end),
                      )}
                      · {conflict.status === "ACCEPTED"
                        ? m.booking_accepted()
                        : m.booking_pending()}
                    </span>
                  {/if}
                </li>
              {/each}
            </ul>
          </Alert.Description>
        </Alert.Root>
      {/if}

      <section class="flex gap-3">
        <DoorOpenIcon class="text-primary mt-0.5 size-5 shrink-0" />
        {#if booking.accessDoors.length > 0}
          <p>
            {booking.accessDoors.map((door) => door.verboseName).join(", ")}
          </p>
        {:else}
          <p class="text-muted-foreground">{m.booking_noDoorAccess()}</p>
        {/if}
      </section>

      {#if booking.accessMembers.length > 0}
        <section class="flex gap-3">
          <UsersIcon class="text-primary mt-0.5 size-5 shrink-0" />
          <ul class="ml-0 flex list-none flex-wrap gap-x-4 gap-y-2">
            {#each booking.accessMembers as member (member.id)}
              <li class="flex items-center gap-1.5 text-sm">
                <MemberAvatar {member} class="size-5" />
                {getFullName(member, { hideNickname: true })}
              </li>
            {/each}
          </ul>
        </section>
      {/if}

      <footer
        class="text-muted-foreground flex flex-wrap items-center justify-between gap-2 pt-1 text-xs"
      >
        {#if booking.created}
          <span>
            {m.booking_requestedAt({
              date: formatShortDateTime(new Date(booking.created)),
            })}
          </span>
        {/if}
        <Button
          variant="ghost"
          size="sm"
          class="-mr-2 h-8 text-xs"
          href="/bookings/admin/{booking.id}"
        >
          <PencilIcon class="size-3" />
          {m.booking_openFullReview()}
        </Button>
      </footer>
    </article>

    <form
      method="POST"
      use:enhance={handleDecision}
      class="{stickyBottomClass} bg-background sticky z-10 -mx-4 mt-4 space-y-2 px-4 pt-2 pb-4"
      style:bottom={stickyBottom}
    >
      <input type="hidden" name="id" value={booking.id} />
      <div class="grid grid-cols-2 gap-3">
        <Button
          type="submit"
          formaction="?/reject"
          variant="outline"
          size="lg"
          disabled={submitting}
          class="border-destructive text-destructive hover:bg-destructive/10 h-14 text-base font-bold"
        >
          <XIcon class="size-5" />
          {m.booking_deny()}
        </Button>
        <Button
          type="submit"
          formaction="?/accept"
          size="lg"
          disabled={submitting}
          class="h-14 text-base font-bold"
        >
          <CheckIcon class="size-5" />
          {m.booking_accept()}
        </Button>
      </div>
      {#if remaining.length > 1}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          class="text-muted-foreground w-full"
          disabled={submitting}
          onclick={() => booking && skipped.add(booking.id)}
        >
          <SkipForwardIcon class="size-4" />
          {m.booking_skip()}
        </Button>
      {/if}
    </form>
  {:else}
    <div
      class="flex flex-1 flex-col items-center justify-center gap-3 py-16 text-center"
    >
      <CheckIcon class="text-primary size-12" />
      {#if remaining.length > 0}
        <p class="text-muted-foreground">
          {m.booking_skippedCount({ count: remaining.length })}
        </p>
        <Button onclick={() => skipped.clear()}>
          {m.booking_startOver()}
        </Button>
      {:else}
        <h2 class="text-2xl font-semibold">{m.booking_allCaughtUp()}</h2>
        <p class="text-muted-foreground">{m.booking_allCaughtUpDesc()}</p>
        <Button variant="outline" href="/bookings">
          <ArrowLeftIcon class="size-4" />
          {m.booking_goBack()}
        </Button>
      {/if}
    </div>
  {/if}
</div>
