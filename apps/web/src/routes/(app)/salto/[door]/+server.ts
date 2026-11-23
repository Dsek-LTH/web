import { PUBLIC_GO_BACKEND_URL } from "$env/static/public";
import type { RequestHandler } from "./$types";
import { passOn } from "$lib/server/proxy";
import { BACKUP_LIST_OF_STUDENT_IDS } from "./constants";

// A thin proxy to Go's GET /salto/{door} (apps/api/internal/doors), same "port the logic to
// Go, keep this URL as a pure forwarder" pattern already established by
// medals/download-csv/+server.ts. This specific URL must never move or
// change shape - see ../README.md: the university's own Salto door-lock
// system polls it directly, unauthenticated, expecting a bare
// newline-separated student-ID list back. No cookie forwarding needed
// (Salto has no session of its own, and neither does Go's handler check
// for one). hooks.server.ts skips its call to Go's /me for this path, so
// this handler still runs when Go is down.
//
// Go falls back to the backup list itself when a door resolves to nobody;
// this covers Go being unreachable or failing, like the old app's
// try/catch did, so the people who fix things can still get in.
export const GET: RequestHandler = async ({ params, fetch }) => {
  const target = new URL(
    `/salto/${encodeURIComponent(params.door)}`,
    PUBLIC_GO_BACKEND_URL,
  );
  try {
    const response = await fetch(target);
    if (response.ok) return passOn(response);
    console.error("salto: Go answered", response.status, "for", params.door);
  } catch (err) {
    console.error("salto: Go unreachable for", params.door, err);
  }
  return new Response(BACKUP_LIST_OF_STUDENT_IDS.join("\n"), {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
};
