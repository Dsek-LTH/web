<script lang="ts">
  import { onMount } from "svelte";
  import { Calendar } from "@fullcalendar/core";
  import daygridPlugin from "@fullcalendar/daygrid";
  import type { Bookable, BookingRequest } from "@prisma/client";
  import { goto } from "$app/navigation";

  export let bookingRequests: (BookingRequest & { bookables: Bookable[] })[] = [];

  let calendarEl: HTMLElement;
  let calendar: Calendar;

  onMount(() => {
    calendar = new Calendar(calendarEl, {
      initialView: "dayGridMonth",
      plugins: [daygridPlugin],
      events: bookingRequests.map((booking) => ({
        title: booking.event ?? "",
        start: booking.start ?? new Date(),
        end: booking.end ?? new Date(),
      })),
      locale: "sv",
      eventColor: "#f280a1",
      firstDay: 1,
      headerToolbar: {
        left: "prev,next,addEvent",
        center: "title",
        right: "dayGridDay,dayGridWeek,dayGridMonth",
      },
      customButtons: {
        subscribe: {
          text: "Subscribe",
          click: () => {
            goto("/events/subscribe");
          },
        },
      },
      buttonText: {
        today: "Idag",
        month: "Månad",
        week: "Vecka",
        day: "Dag",
      },
    });
    calendar.render();

    return () => calendar?.destroy();
  });
</script>

<div
  class="min-w-0 flex-col break-words rounded-2xl border-0 bg-clip-border p-4 shadow-xl"
  bind:this={calendarEl}
></div>

<style lang="postcss">
  /* FullCalendar style overrides */
  /* They need to be global since the classes are defined in the library. */

  :global(.fc-button.fc-button-primary) {
    @apply btn;
  }

  :global(.fc-button.fc-button.fc-button-primary.fc-button-active) {
    @apply btn-primary;
  }

  :global(.fc-toolbar-title) {
    @apply text-2xl font-bold;
  }

  :global(.fc-scrollgrid) {
    @apply table;
  }

  :global(.fc-theme-standard td, .fc-theme-standard th) {
    @apply border border-neutral-700;
  }

  :global(.fc-day-today.fc-day-today.fc-day-today) {
    @apply bg-primary bg-opacity-20;
  }

  :global(.fc-scrollgrid.fc-scrollgrid) {
    @apply border-0;
  }

  :global(.fc-daygrid tr > th:last-child, .fc-daygrid tr > td:last-child) {
    @apply border-r-0;
  }

  :global(.fc-daygrid tr:last-child > td) {
    @apply border-b-0;
  }

  :global(.fc-toolbar) {
    @apply flex-wrap gap-2;
  }
</style>
