import { PUBLIC_GO_BACKEND_URL } from "$env/static/public";
import type { RequestHandler } from "./$types";

// A thin proxy to Go's GET /salto/{door} (backend/internal/doors -
// see backend/CLAUDE.md's "Doors routes" section), same "port the logic to
// Go, keep this URL as a pure forwarder" pattern already established by
// medals/download-csv/+server.ts. This specific URL must never move or
// change shape - see ../README.md: the university's own Salto door-lock
// system polls it directly, unauthenticated, expecting a bare
// newline-separated student-ID list back. No cookie forwarding needed
// (Salto has no session of its own, and neither does Go's handler check
// for one).
export const GET: RequestHandler = async ({ params, fetch }) => {
  const target = new URL(
    `/salto/${encodeURIComponent(params.door)}`,
    PUBLIC_GO_BACKEND_URL,
  );
  return fetch(target);
};
