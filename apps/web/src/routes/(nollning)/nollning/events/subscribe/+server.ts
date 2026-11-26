import { PUBLIC_GO_BACKEND_URL } from "$env/static/public";
import type { RequestHandler } from "./$types";
import { passOn } from "$lib/server/proxy";

// A thin proxy to Go's nollning ICS feed (apps/api/internal/events'
// CalendarICS). Calendar apps subscribe to this URL, so it must keep
// working here.
// Go resolves the events' titles and descriptions from Accept-Language, and
// it is on another origin, so the calendar app's header is passed on.
export const GET: RequestHandler = async ({ fetch, request }) => {
  const acceptLanguage = request.headers.get("accept-language");
  return passOn(
    await fetch(new URL("/nollning/events.ics", PUBLIC_GO_BACKEND_URL), {
      headers: acceptLanguage ? { "accept-language": acceptLanguage } : {},
    }),
  );
};
