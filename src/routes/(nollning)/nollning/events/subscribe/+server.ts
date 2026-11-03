import { PUBLIC_GO_BACKEND_URL } from "$env/static/public";
import type { RequestHandler } from "./$types";

// A thin proxy to Go's nollning ICS feed (backend/internal/events'
// CalendarICS). Calendar apps subscribe to this URL, so it must keep
// working here.
export const GET: RequestHandler = async ({ fetch }) =>
  fetch(new URL("/calendar/nollning.ics", PUBLIC_GO_BACKEND_URL));
