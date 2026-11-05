import { PUBLIC_GO_BACKEND_URL } from "$env/static/public";
import { passOn } from "$lib/server/proxy";

// A thin proxy to Go's GET /medals.csv (apps/api/internal/api/huma_medals.go;
// the typed client only handles JSON, so this forwards the request and
// response directly). No page renders a
// download link yet (the /medals route is still a stub), but the endpoint
// itself is real.
// The event's fetch carries the session (handleFetch in hooks.server.ts).
export const GET = async ({ url, fetch }) => {
  const target = new URL("/medals.csv", PUBLIC_GO_BACKEND_URL);
  target.search = url.search;

  return passOn(await fetch(target));
};
