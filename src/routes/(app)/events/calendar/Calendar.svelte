<script lang="ts">
  import { onMount } from "svelte";
  import { Calendar } from "@fullcalendar/core";
  import daygridPlugin from "@fullcalendar/daygrid";
  import type { Event } from "@prisma/client";
  import { eventLink, goto } from "$lib/utils/redirect";
  import "$lib/FullCalendar.css";
  import * as m from "$paraglide/messages";
  import { languageTag } from "$paraglide/runtime";
  import { toast } from "$lib/stores/toast";
  import { page } from "$app/stores";
  import { i18n } from "$lib/utils/i18n";

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
        url: eventLink(event),
      })),
      locale: languageTag(),
      eventColor: "#f280a1",
      firstDay: 1,
      headerToolbar: {
        left: "prev,next,addEvent,subscribe",
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
            navigator.clipboard.writeText(
              $page.url.origin +
                i18n.resolveRoute("/events/subscribe", languageTag()),
            );
            toast(m.events_calendar_subscribe_copyToClipboard(), "success");
          },
          hint: m.events_calendar_subscribe_details(),
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
/>
