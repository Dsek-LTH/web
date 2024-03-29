<script lang="ts">
  import { onMount } from "svelte";
  import { Calendar } from "@fullcalendar/core";
  import daygridPlugin from "@fullcalendar/daygrid";
  import type { Bookable, BookingRequest } from "@prisma/client";
  import { goto } from "$app/navigation";
  import "$lib/FullCalendar.css";
  import { isAuthorized } from "$lib/utils/authorization";
  import { page } from "$app/stores";
  import apiNames from "$lib/utils/apiNames";

  export let bookingRequests: Array<
    BookingRequest & { bookables: Bookable[] }
  > = [];

  let calendarEl: HTMLElement;
  let calendar: Calendar;

  const admin = isAuthorized(apiNames.BOOKINGS.UPDATE, $page.data.user);

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
        left: "prev,next,addBooking" + (admin ? ",admin" : ""),
        center: "title",
        right: "dayGridDay,dayGridWeek,dayGridMonth",
      },
      customButtons: {
        addBooking: {
          text: "Skapa bokning",
          click: () => {
            void goto("/booking/create");
          },
        },
        admin: {
          text: "Hantera bokningar",
          click: () => {
            void goto("/booking/admin");
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
