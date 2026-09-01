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

export const load: PageServerLoad = async ({ locals, url }) => {
  const { prisma } = locals;

  const week = Number.parseInt(
    url.searchParams.get("week") ?? getCurrentWeek().toString(),
  );
  // check if week is a number, and between 0 and weekStarts.length
  if (Number.isNaN(week) || week < 0 || week >= weekStarts.length) {
    return error(400, "Invalid week parameter");
  }
  const { weekStart, weekEnd } = getWeekInterval(week);

  // Ticket data used to be joined in here (getEventsWithTickets) - removed
  // along with the rest of the shop/ticket feature (see DESIGN.md's "Shop /
  // tickets: cut from scope entirely"). This page is currently a
  // <NotImplemented /> stub regardless (+page.svelte), so a plain event
  // list is enough to keep the load function itself from erroring.
  const events = await prisma.event.findMany({
    where: {
      startDatetime: {
        gte: weekStart,
      },
      endDatetime: {
        lte: weekEnd,
      },
    },
  });

  return {
    week,
    events,
    weeks: weekStarts.length,
  };
};
