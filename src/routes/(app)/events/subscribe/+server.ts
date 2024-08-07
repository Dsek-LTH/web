import { error } from "@sveltejs/kit";
import dayjs from "dayjs";
import { createEvents, type EventAttributes } from "ics";

export const GET = async ({ locals, setHeaders }) => {
  const { prisma } = locals;

  const events = await prisma.event.findMany({
    where: {
      startDatetime: {
        gte: dayjs().subtract(1, "month").toDate(),
      },
      endDatetime: {
        lte: dayjs().add(3, "months").toDate(),
      },
    },
  });

  const icsEvents: EventAttributes[] = events.map((event) => {
    const start = dayjs(event.startDatetime);
    const end = dayjs(event.endDatetime);

    return {
      uid: event.id,
      start: [
        start.year(),
        start.month() + 1,
        start.date(),
        start.hour(),
        start.minute(),
      ],
      end: [end.year(), end.month() + 1, end.date(), end.hour(), end.minute()],
      title: event.title,
      description: event.description,
      location: event.location ?? undefined,
      sequence: event.numberOfUpdates ?? undefined,
    };
  });

  const calendar = createEvents(icsEvents);

  if (calendar.error) {
    error(
      400,
      "Failed to create calendar ICS" +
        JSON.stringify(
          calendar.error,
          Object.getOwnPropertyNames(calendar.error),
        ),
    );
  }

  setHeaders({
    "Content-Type": "text/calendar",
    "Content-Disposition": 'attachment; filename="D-sektionen_events.ics"',
  });

  return new Response(calendar.value);
};
