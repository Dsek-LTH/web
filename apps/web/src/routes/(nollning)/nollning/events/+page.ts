import { api } from "$lib/api/client";
import { toAppTime } from "$lib/utils/datetime";
import { error } from "@sveltejs/kit";
import type { PageLoad } from "./$types";

// The current season's weeks, Monday to Monday in Swedish time, from the
// week nollning starts to the week it ends (these used to be hardcoded
// dates). Computed in Swedish time so SSR (UTC) and the browser agree.
const seasonWeekStarts = (nollaStartAt: string, endAt: string) => {
  const first = toAppTime(nollaStartAt).startOf("day");
  let monday = first.subtract((first.day() + 6) % 7, "day");
  const end = new Date(endAt);
  const starts: Date[] = [];
  while (monday.valueOf() < end.valueOf()) {
    starts.push(monday.toDate());
    monday = monday.add(1, "week");
  }
  return starts;
};

export const load: PageLoad = async ({ fetch, url }) => {
  const current = await api.GET("/nollning/current", { fetch });
  if (current.error)
    error(current.response.status, current.error.detail ?? "Failed to load");
  const season = current.data.season;
  if (!season) return { week: 0, events: [], weeks: 0 };

  const weekStarts = seasonWeekStarts(season.nollaStartAt, season.endAt);
  const weekEnd = (i: number) =>
    weekStarts[i + 1] ?? toAppTime(weekStarts[i]).add(1, "week").toDate();
  const now = Date.now();
  const currentWeek = Math.max(
    0,
    weekStarts.findIndex(
      (start, i) => now >= start.valueOf() && now < weekEnd(i).valueOf(),
    ),
  );
  const week = Number.parseInt(
    url.searchParams.get("week") ?? currentWeek.toString(),
  );
  if (Number.isNaN(week) || week < 0 || week >= weekStarts.length)
    error(400, "Invalid week parameter");

  // Before the reveal the season's events (and with them its theme) stay
  // hidden, and the week shows the guild's general events instead, like the
  // old page did.
  const revealed = current.data.phase === "post_reveal";
  const res = await api.GET("/events", {
    fetch,
    params: {
      query: {
        span: "range",
        from: weekStarts[week]!.toISOString(),
        to: weekEnd(week).toISOString(),
        ...(revealed ? { nollningSeasonId: season.id } : {}),
        pageSize: 500,
      },
    },
  });
  if (res.error)
    error(res.response.status, res.error.detail ?? "Failed to load events");
  return { week, events: res.data.events, weeks: weekStarts.length };
};
