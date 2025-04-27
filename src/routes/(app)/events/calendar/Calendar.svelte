<script lang="ts">
  import { page } from "$app/stores";
  import "$lib/FullCalendar.css";
  import { toast } from "$lib/stores/toast";
  import { i18n } from "$lib/utils/i18n";
  import { eventLink, goto } from "$lib/utils/redirect";
  import * as m from "$paraglide/messages";
  import { languageTag } from "$paraglide/runtime";
  import { Calendar } from "@fullcalendar/core";
  import daygridPlugin from "@fullcalendar/daygrid";
  import type { Event } from "@prisma/client";
  import dayjs from "dayjs";
  import type { RangeDateParam, ViewParam } from "./+page.server";

  interface Props {
    events?: Event[];
  }

  let { events = [] }: Props = $props();
  const formatViewName = (view: string | null) => {
    switch (view) {
      case "day":
        return "dayGridDay";
      case "week":
        return "dayGridWeek";
      case "month":
        return "dayGridMonth";
      default:
        return null;
    }
  };
  const reverseViewName = (viewType: string): ViewParam | null => {
    switch (viewType) {
      case "dayGridDay":
        return "day";
      case "dayGridWeek":
        return "week";
      case "dayGridMonth":
        return "month";
      default:
        return null;
    }
  };

  function renderCalendar(calendarEl: HTMLElement) {
    const cal = new Calendar(calendarEl, {
      initialView: view ? view : "dayGridMonth",
      initialDate: middleDate ?? undefined,
      plugins: [daygridPlugin],
      events: events.map((event) => ({
        title: event.title,
        start: event.startDatetime,
        end: event.endDatetime,
        url: eventLink(event),
        color: event.isCancelled ? "rgb(250, 43, 43)" : "#f280a1",
        className: event.isCancelled ? "!line-through" : "",
      })),
      locale: languageTag(),

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
      datesSet: (arg) => {
        const startDate: RangeDateParam = arg.startStr;
        const endDate: RangeDateParam = arg.endStr;
        const view = reverseViewName(arg.view.type);
        if (!view) throw new Error("Unsupported view type");
        const urlParams = new URLSearchParams($page.url.searchParams);
        urlParams.set("startDate", startDate);
        urlParams.set("endDate", endDate);
        urlParams.set("view", view);
        goto(`${i18n.route($page.url.pathname)}?${urlParams.toString()}`, {
          replaceState: true,
        });
      },
    });
    cal.render();
    return {
      destroy() {
        cal.destroy();
      },
    };
  }
  let params = $derived($page.url.searchParams);
  let view = $derived(formatViewName(params.get("view")));
  let middleDate = $derived(
    (() => {
      const startDate = params.get("startDate");
      const endDate = params.get("endDate");
      if (startDate && endDate) {
        return dayjs(startDate)
          .add(dayjs(endDate).diff(startDate, "days") / 2, "day")
          .toDate();
      }
      return null;
    })(),
  );
</script>

<div
  use:renderCalendar
  class="min-w-0 flex-col break-words rounded-2xl border-0 bg-clip-border p-4 shadow-xl"
></div>
