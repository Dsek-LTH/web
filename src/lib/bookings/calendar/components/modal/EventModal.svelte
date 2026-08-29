<script module lang="ts">
  import { SvelteMap } from "svelte/reactivity";
  import type { BookingStatus } from "$lib/bookings/eventTypes";

  // schedule-x re-renders its custom components through a keyless list, which
  // can tear down and recreate this component (e.g. right after the calendar
  // re-syncs following an accept/reject) with a stale snapshot of the event.
  // Component-local $state doesn't survive that remount, so the optimistic
  // status is kept here instead, at module scope, keyed by booking id.
  const optimisticStatusOverrides = new SvelteMap<string, BookingStatus>();
</script>

<script lang="ts">
  import Button, {
    buttonVariants,
  } from "$lib/components/ui/button/button.svelte";
  import * as AlertDialog from "$lib/components/ui/alert-dialog";
  import {
    TextAlignStart,
    MapPin,
    User,
    CalendarPlus,
    CheckIcon,
    XIcon,
    PencilIcon,
    Trash2Icon,
  } from "@lucide/svelte";
  import type { CalendarEventExternal } from "@schedule-x/calendar";
  import type { BookingCalendarEvent } from "$lib/bookings/eventTypes";
  import Separator from "$lib/components/ui/separator/separator.svelte";
  import Duration from "./Duration.svelte";
  import Section from "./Section.svelte";
  import Header from "./Header.svelte";
  import { createEvent } from "ics";
  import * as m from "$paraglide/messages";
  import { enhance } from "$app/forms";
  import type { SubmitFunction } from "@sveltejs/kit";
  import { page } from "$app/state";
  import apiNames from "$lib/utils/apiNames";
  import { isAuthorized } from "$lib/utils/authorization";
  import { cn } from "$lib/utils";

  const { calendarEvent }: { calendarEvent: CalendarEventExternal } = $props();
  const bookingEvent = $derived(calendarEvent as BookingCalendarEvent);

  const startDate = $derived(calendarEvent.start);
  const endDate = $derived(calendarEvent.end);

  const currentUser = $derived(page.data.user);
  const isAdmin = $derived(
    isAuthorized(apiNames.BOOKINGS.UPDATE, currentUser),
  );
  const isOwner = $derived(
    !!currentUser?.studentId &&
      currentUser.studentId === bookingEvent.bookerStudentId,
  );
  const canManage = $derived(isAdmin || isOwner);

  const eventId = $derived(String(calendarEvent.id));
  const status = $derived(
    optimisticStatusOverrides.get(eventId) ?? bookingEvent.calendarId,
  );

  const handleStatusChange: SubmitFunction = ({ action }) => {
    const nextStatus = action.searchParams.has("/accept")
      ? "ACCEPTED"
      : "DENIED";

    return async ({ result, update }) => {
      if (result.type === "success") {
        optimisticStatusOverrides.set(eventId, nextStatus);
      }
      await update();
    };
  };

  function temporalToArray(
    dt: Temporal.PlainDate | Temporal.ZonedDateTime,
    isEndDate = false,
  ): [number, number, number] | [number, number, number, number, number] {
    if (dt instanceof Temporal.PlainDate) {
      // For all-day events, ICS expects DTEND to be exclusive
      const date = isEndDate ? dt.add({ days: 1 }) : dt;
      return [date.year, date.month, date.day];
    } else if (dt instanceof Temporal.ZonedDateTime) {
      return [dt.year, dt.month, dt.day, dt.hour, dt.minute];
    } else {
      throw new Error("Unsupported date type");
    }
  }

  export function exportBookingToCalendar(booking: CalendarEventExternal) {
    const start = temporalToArray(booking.start);
    const end = temporalToArray(booking.end, true);

    const event = {
      title: booking.title ?? "Booking",
      description: booking.description,
      start,
      end,
      location: booking.location,
    };

    createEvent(event, (error, value) => {
      if (error) {
        console.error("Failed to generate ICS:", error);

        return;
      }

      const blob = new Blob([value], { type: "text/calendar" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `${booking.title ?? "booking"}.ics`;
      a.click();

      URL.revokeObjectURL(url);
    });
  }
</script>

<div
  class="bg-background border-border/40 w-[340px] rounded-2xl border p-6 shadow-2xl"
>
  <Header title={calendarEvent.title ?? "-"} calendarId={status} />

  <div class="space-y-4">
    <Duration {startDate} {endDate} />

    <Section Icon={User} header={bookingEvent.bookerName ?? "-"} />

    <Section Icon={MapPin} header={calendarEvent.location ?? "-"} />

    <Separator class="bg-muted mt-5 mb-2" />

    <Section
      Icon={TextAlignStart}
      class="text-muted-foreground mt-0 leading-relaxed"
    >
      {#snippet content()}
        <p class="text-[11px]">
          {calendarEvent.description}
        </p>
      {/snippet}
    </Section>
  </div>

  <div class="mt-6 space-y-2">
    {#if isAdmin || canManage}
      <div class="flex items-center gap-2">
        {#if isAdmin}
          <form
            method="POST"
            action="/bookings"
            use:enhance={handleStatusChange}
            class="contents"
          >
            <input type="hidden" name="id" value={calendarEvent.id} />
            <Button
              type="submit"
              formaction="/bookings?/reject"
              variant="outline"
              size="icon"
              disabled={status === "DENIED"}
              aria-label={m.booking_deny()}
              class="border-destructive text-destructive hover:bg-destructive/10"
            >
              <XIcon class="size-4" />
            </Button>
            <Button
              type="submit"
              formaction="/bookings?/accept"
              size="icon"
              disabled={status === "ACCEPTED"}
              aria-label={m.booking_accept()}
            >
              <CheckIcon class="size-4" />
            </Button>
          </form>
        {/if}

        {#if canManage}
          <Button
            variant="outline"
            size="icon"
            href={`/bookings/${calendarEvent.id}/edit`}
            aria-label={m.booking_edit()}
          >
            <PencilIcon class="size-4" />
          </Button>

          <AlertDialog.Root>
            <AlertDialog.Trigger
              type="button"
              class={cn(
                buttonVariants({ variant: "outline", size: "icon" }),
                "border-destructive text-destructive hover:bg-destructive/10",
              )}
              aria-label={m.booking_delete()}
            >
              <Trash2Icon class="size-4" />
            </AlertDialog.Trigger>
            <AlertDialog.Content>
              <form method="POST" action="/bookings?/delete" use:enhance>
                <input type="hidden" name="id" value={calendarEvent.id} />
                <AlertDialog.Header>
                  <AlertDialog.Title
                    >{m.booking_deleteTitle()}</AlertDialog.Title
                  >
                  <AlertDialog.Description>
                    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                    {@html isOwner && !isAdmin
                      ? m.booking_deleteMyAreYouSure({
                          bookables: calendarEvent.location ?? "",
                        })
                      : m.booking_deleteAreYouSure({
                          name: bookingEvent.bookerName ?? "",
                          bookables: calendarEvent.location ?? "",
                        })}
                  </AlertDialog.Description>
                </AlertDialog.Header>
                <AlertDialog.Footer>
                  <AlertDialog.Cancel type="button">
                    {m.cancel()}
                  </AlertDialog.Cancel>
                  <AlertDialog.Action type="submit">
                    {m.booking_delete()}
                  </AlertDialog.Action>
                </AlertDialog.Footer>
              </form>
            </AlertDialog.Content>
          </AlertDialog.Root>
        {/if}

        <div class="flex-1"></div>

        <Button
          variant="outline"
          size="icon"
          aria-label={m.booking_addToMyCalendar()}
          onclick={() => exportBookingToCalendar(calendarEvent)}
        >
          <CalendarPlus class="size-4" />
        </Button>
      </div>
    {:else}
      <Button
        variant="outline"
        class="w-full"
        onclick={() => exportBookingToCalendar(calendarEvent)}
      >
        <CalendarPlus class="size-4" />
        <span class="uppercase">{m.booking_addToMyCalendar()}</span>
      </Button>
    {/if}
  </div>
</div>
