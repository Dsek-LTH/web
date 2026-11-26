import { error, type Cookies, type RequestEvent } from "@sveltejs/kit";
import { PUBLIC_GO_BACKEND_URL } from "$env/static/public";
import type { components } from "$lib/api/schema";

/**
 * The Go backend's GET /me response (apps/api/internal/api/huma_me.go). Go
 * is the OIDC/session authority.
 * member is omitted for an anonymous caller.
 */
export type GoIdentity = components["schemas"]["Me"];

const identities = new WeakMap<RequestEvent, Promise<GoIdentity>>();

/**
 * Calls Go's GET /me, forwarding this request's cookies there and forwarding
 * back any Set-Cookie it issues (e.g. a re-issued dsek_session after a
 * silent token refresh - see RealAuthenticator.Authenticate). This is a
 * server-to-server call to a different origin, so unlike a direct browser
 * fetch to the Go API (which the browser handles natively), nothing
 * forwards cookies in either direction automatically - it has to be done
 * by hand here.
 *
 * Memoized per request: hooks.server.ts asks twice (paraglide's locale
 * strategy, then identityHandle). Two calls with the same expired session
 * would each refresh it, and Authentik rotates the refresh token on use,
 * so the second one fails and Go clears the cookie - a logout every time
 * the access token expires.
 */
export function fetchIdentity(event: RequestEvent): Promise<GoIdentity> {
  let identity = identities.get(event);
  if (!identity) {
    identity = requestIdentity(event);
    identities.set(event, identity);
  }
  return identity;
}

async function requestIdentity(event: RequestEvent): Promise<GoIdentity> {
  const res = await fetch(`${PUBLIC_GO_BACKEND_URL}/me`, {
    headers: { cookie: cookieHeader(event.cookies) },
  });
  if (!res.ok) {
    error(502, "auth backend unavailable");
  }
  forwardSetCookies(res, event.cookies);
  return res.json();
}

/**
 * The Cookie header to send Go on behalf of this request: event.cookies
 * rather than the raw request header, so a session Go re-issued earlier in
 * the same request (forwardSetCookies) is sent instead of the expired one.
 * Cookies deleted during the request show up in getAll() with an empty
 * value; they're left out.
 */
export function cookieHeader(cookies: Cookies): string {
  return cookies
    .getAll()
    .filter(({ value }) => value !== "")
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");
}

/**
 * Whether url is on the Go API, i.e. a request that should carry this
 * request's cookies (see handleFetch in hooks.server.ts).
 */
export function isGoBackendUrl(url: string | URL): boolean {
  return new URL(url).origin === new URL(PUBLIC_GO_BACKEND_URL).origin;
}

/**
 * Parses a Go response's Set-Cookie header(s) (e.g. a re-issued
 * dsek_session after a silent token refresh) back into SvelteKit's own
 * cookie jar - shared with src/lib/server/apiClient.ts's serverApi, which
 * needs the exact same forwarding for every other Go endpoint, not just
 * /me.
 */
export function forwardSetCookies(response: Response, cookies: Cookies) {
  for (const header of response.headers.getSetCookie()) {
    const [pair = "", ...attrs] = header.split(";").map((s) => s.trim());
    const eq = pair.indexOf("=");
    const name = pair.slice(0, eq);
    const value = pair.slice(eq + 1);

    let path = "/";
    let maxAge: number | undefined;
    const opts: {
      domain?: string;
      sameSite?: "lax" | "strict" | "none";
      httpOnly?: boolean;
      secure?: boolean;
    } = {};
    for (const attr of attrs) {
      const [rawKey, rawVal] = attr.split("=");
      switch (rawKey?.toLowerCase()) {
        case "domain":
          opts.domain = rawVal;
          break;
        case "path":
          path = rawVal ?? "/";
          break;
        case "max-age":
          maxAge = Number(rawVal);
          break;
        case "samesite":
          opts.sameSite = rawVal?.toLowerCase() as "lax" | "strict" | "none";
          break;
        case "httponly":
          opts.httpOnly = true;
          break;
        case "secure":
          opts.secure = true;
          break;
      }
    }

    // Go's MaxAge: -1 is sent as Max-Age=0.
    if (maxAge !== undefined && maxAge <= 0) {
      cookies.delete(name, { path, ...opts });
    } else {
      // The value is already cookie-safe as Go sent it; SvelteKit's default
      // encodeURIComponent would turn securecookie's base64 padding into
      // %3D, which Go then can't decode.
      cookies.set(name, value, { path, maxAge, encode: (v) => v, ...opts });
    }
  }
}
