<script lang="ts">
  import { onMount } from "svelte";
  import { Calendar } from "@fullcalendar/core";
  import daygridPlugin from "@fullcalendar/daygrid";
  import type { Event } from "@prisma/client";
  import { goto } from "$lib/utils/redirect";
  import "$lib/FullCalendar.css";
  import * as m from "$paraglide/messages";
  import { languageTag } from "$paraglide/runtime";

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
      locale: languageTag(),
      eventColor: "#f280a1",
      firstDay: 1,
      headerToolbar: {
        left: "prev,next,addEvent",
        center: "title",
        right: "dayGridDay,dayGridWeek,dayGridMonth",
      },
      customButtons: {
        addEvent: {
          text: m.events_createEvent(),
          click: () => {
            void goto("/events/create");
          },
        },
        subscribe: {
          text: m.events_calendar_subscribe(),
          click: () => {
            void goto("/events/subscribe");
          },
        },
      },
      buttonText: {
        today: m.events_calendar_today(),
        month: m.events_calendar_month(),
        week: m.events_calendar_week(),
        day: m.events_calendar_day(),
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
