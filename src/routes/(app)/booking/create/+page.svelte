<script lang="ts">
  import type { PageData } from "./$types";
  import * as m from "$paraglide/messages";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import BookingEditor from "../BookingEditor.svelte";
  import { twMerge } from "tailwind-merge";
  import Calendar from "@event-calendar/core";
  import TimeGrid from "@event-calendar/resource-timeline";
  import "./BookingCalendar.css";
  import { getFullName } from "$lib/utils/client/member";
  import dayjs from "dayjs";
  import { onMount } from "svelte";
  import type { Member } from "@prisma/client";

  export let data: PageData;

  const slotWidth = 150;

  let plugins = [TimeGrid];
  let options: Calendar.Options = {
    view: "resourceTimelineMonth",
    events: data.bookingRequests
      .filter((booking) => booking.start !== null && booking.end !== null)
      .map((booking) => ({
        id: booking.id,
        start: booking.start as Date,
        end: booking.end as Date,
        title: booking.event ?? "",
        resourceIds: booking.bookables.map((bookable) => bookable.id),
        extendedProps: { ...booking },
      })),
    resources: data.bookables.map((bookable) => ({
      id: bookable.id,
      title: bookable.name,
    })),
    slotWidth,
    eventContent: (info) => {
      const startTime = dayjs(info.event.start).format("HH:mm");
      const endTime = dayjs(info.event.end).format("HH:mm");
      const eventTitle = info.event.title;
      const bookerName = getFullName(
        info.event.extendedProps["booker"] as Member,
        {
          hideNickname: true,
        },
      );
      const status = info.event.extendedProps["status"];
      const statusClass = (() => {
        switch (status) {
          case "ACCEPTED":
            return "bg-success dark:text-black";
          case "DENIED":
            return "bg-error dark:text-black";
          case "PENDING":
            return "bg-info dark:text-black";
          default:
            return "bg-primary";
        }
      })();

      return {
        html: `
          <div class="${twMerge("overflow-hidden w-full shadow-md rounded *:text-nowrap p-2", statusClass)}">
            <strong>${startTime} - ${endTime}</strong>
            <p>${bookerName}</p>
            <i title="${eventTitle}" class="text-xs opacity-60">${eventTitle}</i>
          </div>
        `,
      };
    },
  };

  onMount(() => {
    function scrollToToday() {
      const scrollEl = document.querySelector(".ec-body");
      if (scrollEl) {
        const x = slotWidth * (new Date().getDate() - 1);
        scrollEl.scrollTo({
          left: x,
          behavior: "smooth",
        });
        return true;
      }
      return false;
    }

    setTimeout(scrollToToday, 300);
  });
</script>

<SetPageTitle title={m.booking_createBooking()} />

<BookingEditor {data} />

<div class="mb-8 mt-16" style="--slot-width: {slotWidth}px">
  <Calendar {plugins} {options} />
</div>

<div class="badge badge-success">
  <span class="i-mdi-check-circle mr-1" />{m.booking_accepted()}
</div>
<div class="badge badge-error">
  <span class="i-mdi-denied mr-1" />{m.booking_denied()}
</div>
<div class="badge badge-info">
  <span class="i-mdi-hourglass mr-1" />{m.booking_pending()}
</div>
