/**
 * Go's response, passed on from a `+server.ts` proxy. The Response fetch
 * returns has immutable headers, and SvelteKit adds to them afterwards (any
 * cookie set during the request, e.g. the externalCode hooks.server.ts
 * gives a caller without one, like Salto or a calendar app) - returning it
 * as is makes every such request a 500. fetch has already decoded the
 * body, so Go's encoding and length headers don't apply to it anymore.
 */
export function passOn(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.delete("content-encoding");
  headers.delete("content-length");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
