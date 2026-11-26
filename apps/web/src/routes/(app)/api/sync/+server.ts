import type { RequestHandler } from "./$types";
import { PUBLIC_GO_BACKEND_URL } from "$env/static/public";

/**
 * Starts a search-index rebuild for a caller holding SYNC_PASSWORD (sent as
 * the request body). The rebuild lives in the Go backend; this URL stays as
 * a thin proxy since it may be called by an external scheduled job.
 *
 * This calls Go with Node's global fetch, not the event's: SvelteKit's
 * server-side fetch adds `Origin: <this server's origin>` to a cross-origin
 * POST, and Go rejects writes whose Origin isn't PUBLIC_FRONTEND_URL's
 * (CSRF protection), which the origin this server sees itself as (behind
 * the ingress, or an in-cluster hostname) need not be. The global fetch
 * sends no Origin, so Go treats it as the server-to-server call it is. The
 * password is the only credential; no cookies are needed.
 */
export const POST: RequestHandler = async ({ request }) => {
  const res = await globalThis.fetch(
    `${PUBLIC_GO_BACKEND_URL}/search/sync/password`,
    { method: "POST", body: await request.text() },
  );
  return new Response(await res.text(), { status: res.status });
};
