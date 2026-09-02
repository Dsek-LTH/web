import createClient from "openapi-fetch";
import type { RequestEvent } from "@sveltejs/kit";
import { PUBLIC_GO_BACKEND_URL } from "$env/static/public";
import { getLocale } from "$paraglide/runtime";
import { forwardSetCookies } from "./goAuth";
import type { paths } from "$lib/api/schema";

/**
 * A per-request Go API client for `.server.ts` load/action code.
 *
 * $lib/api/client's shared `api` singleton is correct for real browser
 * fetches (the browser's own cookie jar attaches the session cookie and
 * stores any Set-Cookie response automatically - nothing to do there).
 * But a call made from inside the Node process itself - a
 * `+page.server.ts` load or form action - is a server-to-server request
 * with no browser involved at any point, so `credentials: "include"` has
 * no ambient cookie jar to draw from and silently does nothing. This is
 * the exact same problem src/lib/server/goAuth.ts's fetchIdentity() has
 * always had to solve by hand for its own call to Go's /me; this
 * generalizes that same forwarding to every other endpoint a
 * `.server.ts` file calls.
 *
 * By the time any route's load/action runs, hooks.server.ts's
 * databaseHandle has already called fetchIdentity() once for this same
 * request (and, via forwardSetCookies, already rewritten event.cookies if
 * Go silently refreshed the session) - so reading from event.cookies here
 * rather than the raw incoming request header always sees that freshest
 * value, not a stale one.
 */
export function serverApi(event: RequestEvent) {
  const client = createClient<paths>({
    baseUrl: PUBLIC_GO_BACKEND_URL,
    credentials: "include",
  });

  client.use({
    onRequest({ request }) {
      request.headers.set("Accept-Language", getLocale());
      const cookie = event.cookies
        .getAll()
        .map(({ name, value }) => `${name}=${value}`)
        .join("; ");
      if (cookie) request.headers.set("cookie", cookie);
      return request;
    },
    onResponse({ response }) {
      forwardSetCookies(response, event.cookies);
      return response;
    },
  });

  return client;
}
