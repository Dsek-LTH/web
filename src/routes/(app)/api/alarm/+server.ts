import { PUBLIC_GO_BACKEND_URL } from "$env/static/public";
import type { RequestHandler } from "./$types";

// A thin proxy to Go's GET /alarm: "true" while an alarm-flagged event is
// running, else "false". Kept at this URL for whatever polls it.
export const GET: RequestHandler = async ({ fetch }) =>
  fetch(new URL("/alarm", PUBLIC_GO_BACKEND_URL));
