import { BASIC_EVENT_FILTER } from "$lib/events/events.js";
import { error } from "@sveltejs/kit";

const weekStarts = [
  "2024-08-26",
  "2024-09-02",
  "2024-09-09",
  "2024-09-16",
  "2024-09-23",
  "2024-09-30",
];

export const load = async ({ locals, url }) => {
  const { prisma } = locals;
  const week = Number.parseInt(url.searchParams.get("week") ?? "0");
  // check if week is a number, and between 0 and weekStarts.length
  if (Number.isNaN(week) || week < 0 || week >= weekStarts.length) {
    return error(400, "Invalid week parameter");
  }
  const weekStart = new Date(weekStarts[week]!);
  const weekEnd = new Date(weekStart.valueOf() + 7 * 24 * 60 * 60 * 1000);
  const events = await prisma.event.findMany({
    where: {
      ...BASIC_EVENT_FILTER(true),
      startDatetime: {
        gte: weekStart,
      },
      endDatetime: {
        lte: weekEnd,
      },
    },
    orderBy: {
      startDatetime: "asc",
    },
  });

  return {
    week,
    events,
    weeks: weekStarts.length,
  };
};
