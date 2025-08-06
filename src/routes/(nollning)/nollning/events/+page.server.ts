import { getEventsWithTickets } from "$lib/server/shop/getTickets";
import { ticketPageActions } from "$lib/server/shop/tickets/actions";
import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types.js";

const weekStarts = [
  "2025-08-25",
  "2025-09-01",
  "2025-09-08",
  "2025-09-15",
  "2025-09-22",
  "2025-09-29",
];

const getWeekInterval = (week: number) => {
  const weekStart = new Date(weekStarts[week]!);
  const weekEnd = new Date(weekStart.valueOf() + 7 * 24 * 60 * 60 * 1000);
  return { weekStart, weekEnd };
};

const getCurrentWeek = () => {
  const now = new Date();
  for (let i = 0; i < weekStarts.length; i++) {
    const { weekStart, weekEnd } = getWeekInterval(i);
    if (now >= weekStart && now < weekEnd) {
      return i;
    }
  }
  return 0;
};

export const load: PageServerLoad = async ({
  locals,
  url,
  depends,
  parent,
}) => {
  const { prisma } = locals;
  const { revealTheme } = await parent();

  const week = Number.parseInt(
    url.searchParams.get("week") ?? getCurrentWeek().toString(),
  );
  // check if week is a number, and between 0 and weekStarts.length
  if (Number.isNaN(week) || week < 0 || week >= weekStarts.length) {
    return error(400, "Invalid week parameter");
  }
  const { weekStart, weekEnd } = getWeekInterval(week);

  depends("tickets");
  const events = await getEventsWithTickets(
    prisma,
    locals.user,
    {
      startDatetime: {
        gte: weekStart,
      },
      endDatetime: {
        lte: weekEnd,
      },
    },
    revealTheme,
  );

  return {
    week,
    events: events,
    weeks: weekStarts.length,
  };
};

export const actions = ticketPageActions("shop/");
