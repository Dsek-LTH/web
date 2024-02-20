<script lang="ts">
  import { onMount } from "svelte";
  import { Calendar } from "@fullcalendar/core";
  import daygridPlugin from "@fullcalendar/daygrid";
  import type { Event } from "@prisma/client";
  import { goto } from "$app/navigation";
  import "$lib/FullCalendar.css";

  export let events: Event[] = [];

  let calendarEl: HTMLElement;
  let calendar: Calendar;

  onMount(() => {
    calendar = new Calendar(calendarEl, {
      initialView: "dayGridMonth",
      plugins: [daygridPlugin],
      events: events.map((event) => ({
        title: event.title,
        start: event.startDatetime,
        end: event.endDatetime,
        url: `/events/${event.slug}`,
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
        addEvent: {
          text: "Skapa evenemang",
          click: () => {
            void goto("/events/create");
          },
        },
        subscribe: {
          text: "Subscribe",
          click: () => {
            void goto("/events/subscribe");
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
