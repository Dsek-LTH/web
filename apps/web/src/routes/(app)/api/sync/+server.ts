import type { RequestHandler } from "./$types";
import { PUBLIC_GO_BACKEND_URL } from "$env/static/public";

/**
 * Starts a search-index rebuild for a caller holding SYNC_PASSWORD (sent as
 * the request body). The rebuild lives in the Go backend; this URL stays as
 * a thin proxy since it may be called by an external scheduled job.
 */
export const POST: RequestHandler = async ({ request, fetch }) => {
  const res = await fetch(`${PUBLIC_GO_BACKEND_URL}/search/sync/password`, {
    method: "POST",
    body: await request.text(),
  });
  return new Response(await res.text(), { status: res.status });
};
