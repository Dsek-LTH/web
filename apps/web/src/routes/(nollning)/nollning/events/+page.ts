import { api } from "$lib/api/client";
import dayjs from "dayjs";
import { error } from "@sveltejs/kit";
import type { PageLoad } from "./$types";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

// The current season's weeks, Monday to Monday, from the week nollning
// starts to the week it ends (these used to be hardcoded dates).
const seasonWeekStarts = (nollaStartAt: string, endAt: string) => {
  const first = dayjs(nollaStartAt).startOf("day");
  const monday = first.subtract((first.day() + 6) % 7, "day").toDate();
  const end = new Date(endAt);
  const starts: Date[] = [];
  for (let t = monday.valueOf(); t < end.valueOf(); t += WEEK_MS)
    starts.push(new Date(t));
  return starts;
};

export const load: PageLoad = async ({ fetch, url }) => {
  const current = await api.GET("/nollning/current", { fetch });
  if (current.error)
    error(current.response.status, current.error.detail ?? "Failed to load");
  const season = current.data.season;
  if (!season) return { week: 0, events: [], weeks: 0 };

  const weekStarts = seasonWeekStarts(season.nollaStartAt, season.endAt);
  const now = Date.now();
  const currentWeek = Math.max(
    0,
    weekStarts.findIndex(
      (start) => now >= start.valueOf() && now < start.valueOf() + WEEK_MS,
    ),
  );
  const week = Number.parseInt(
    url.searchParams.get("week") ?? currentWeek.toString(),
  );
  if (Number.isNaN(week) || week < 0 || week >= weekStarts.length)
    error(400, "Invalid week parameter");

  const from = weekStarts[week]!;
  const res = await api.GET("/events", {
    fetch,
    params: {
      query: {
        span: "range",
        from: from.toISOString(),
        to: new Date(from.valueOf() + WEEK_MS).toISOString(),
        nollningSeasonId: season.id,
        pageSize: 500,
      },
    },
  });
  if (res.error)
    error(res.response.status, res.error.detail ?? "Failed to load events");
  return { week, events: res.data.events, weeks: weekStarts.length };
};
