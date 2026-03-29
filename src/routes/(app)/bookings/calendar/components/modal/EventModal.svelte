<script lang="ts">
  import Button from "$lib/components/ui/button/button.svelte";
  import { TextAlignStart, MapPin, User, CalendarPlus } from "@lucide/svelte";
  import type { CalendarEventExternal } from "@schedule-x/calendar";
  import Separator from "$lib/components/ui/separator/separator.svelte";
  import Duration from "./Duration.svelte";
  import Section from "./Section.svelte";
  import Header from "./Header.svelte";
  import { createEvent } from "ics";
  import * as m from "$paraglide/messages";

  const { calendarEvent }: { calendarEvent: CalendarEventExternal } = $props();

  const startDate = $derived(calendarEvent.start);
  const endDate = $derived(calendarEvent.end);

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
  <Header
    title={calendarEvent.title ?? "-"}
    calendarId={calendarEvent.calendarId}
  />

  <div class="space-y-4">
    <Duration {startDate} {endDate} />

    <Section Icon={User} header={calendarEvent.people?.[0] ?? "-"} />

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

  <div class="mt-6">
    <Button
      class="w-full"
      onclick={() => exportBookingToCalendar(calendarEvent)}
    >
      <CalendarPlus class="size-4" />
      <span class="uppercase">{m.booking_addToMyCalendar()}</span>
    </Button>
  </div>
</div>
