import { error, type Cookies, type RequestEvent } from "@sveltejs/kit";
import { PUBLIC_GO_BACKEND_URL } from "$env/static/public";

/**
 * The Go backend's GET /me response (backend/internal/auth/me.go) - the
 * resolved Identity plus the profile fields it doesn't carry. See
 * backend/DESIGN.md's Auth section: Go is now the OIDC/session authority,
 * not @auth/sveltekit.
 */
export interface GoIdentity {
  studentId: string;
  memberId: string;
  policies: string[];
  roles: string[];
  givenName: string;
  familyName: string;
  email: string;
  classYear: number | null;
  classProgramme: string | null;
}

/**
 * Calls Go's GET /me, forwarding this request's cookies there and forwarding
 * back any Set-Cookie it issues (e.g. a re-issued dsek_session after a
 * silent token refresh - see RealAuthenticator.Authenticate). This is a
 * server-to-server call to a different origin, so unlike a direct browser
 * fetch to the Go API (which the browser handles natively), nothing
 * forwards cookies in either direction automatically - it has to be done
 * by hand here.
 */
export async function fetchIdentity(event: RequestEvent): Promise<GoIdentity> {
  const res = await fetch(`${PUBLIC_GO_BACKEND_URL}/me`, {
    headers: { cookie: event.request.headers.get("cookie") ?? "" },
  });
  if (!res.ok) {
    error(502, "auth backend unavailable");
  }
  forwardSetCookies(res, event.cookies);
  return res.json();
}

function forwardSetCookies(response: Response, cookies: Cookies) {
  for (const header of response.headers.getSetCookie()) {
    const [pair = "", ...attrs] = header.split(";").map((s) => s.trim());
    const eq = pair.indexOf("=");
    const name = pair.slice(0, eq);
    const value = pair.slice(eq + 1);

    let path = "/";
    let maxAge: number | undefined;
    const opts: { domain?: string; sameSite?: "lax" | "strict" | "none"; httpOnly?: boolean; secure?: boolean } = {};
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

    if (maxAge !== undefined && maxAge < 0) {
      cookies.delete(name, { path, ...opts });
    } else {
      cookies.set(name, value, { path, maxAge, ...opts });
    }
  }
}
