import { PUBLIC_GO_BACKEND_URL } from "$env/static/public";
import type { RequestHandler } from "./$types";
import { passOn } from "$lib/server/proxy";

// A thin proxy to Go's ICS feed (apps/api/internal/events' CalendarICS).
// Calendar apps subscribe to this URL, so it must keep working here.
export const GET: RequestHandler = async ({ fetch }) =>
  passOn(await fetch(new URL("/events.ics", PUBLIC_GO_BACKEND_URL)));
