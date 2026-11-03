import "temporal-polyfill/global";
import { env } from "$env/dynamic/private";
import { themes, type Theme } from "$lib/utils/themes";
import { cookieName, defineCustomServerStrategy } from "$paraglide/runtime";
import { fetchIdentity } from "$lib/server/goAuth";
import { redirect, type Handle, type HandleServerError } from "@sveltejs/kit";
import { sequence } from "@sveltejs/kit/hooks";
import { randomBytes } from "crypto";
import { paraglideMiddleware } from "$paraglide/server";
import { getRequestEvent } from "$app/server";
import {
  httpRequestsTotal,
  httpRequestDurationMs,
  inflightRequests,
} from "$lib/server/metrics";

// Identity/session resolution (login, refresh, roles/policies) is owned
// entirely by the Go backend (backend/internal/auth) - see DESIGN.md's Auth
// section. This handle asks Go who the caller is (via the shared
// dsek_session cookie) and sets locals.user/locals.member from the answer.
// Go's /auth/callback creates the member row on first login.
const identityHandle: Handle = async ({ event, resolve }) => {
  const identity = await fetchIdentity(event);

  if (!identity.studentId || !identity.member) {
    let externalCode = event.cookies.get("externalCode"); // Retrieve the externalCode from cookies
    if (!externalCode) {
      // Generate a new externalCode if it doesn't exist
      externalCode = randomBytes(16).toString("hex");
      event.cookies.set("externalCode", externalCode, {
        httpOnly: false, // Make the cookie accessible to client-side JavaScript
        path: "/", // Cookie is available on all pages
        secure: process.env["NODE_ENV"] === "production", // Only send cookie over HTTPS in production
      });
    }
    event.locals.user = {
      policies: identity.policies,
      roles: identity.roles,
      externalCode,
    };
  } else {
    const { member } = identity;
    if (
      event.url.pathname != "/onboarding" &&
      (!member.classProgramme || !member.classYear) // consider adding email here, but make sure to fix onboarding as well
    ) {
      redirect(302, "/onboarding");
    }
    event.locals.user = {
      studentId: identity.studentId,
      memberId: identity.memberId,
      policies: identity.policies,
      roles: identity.roles,
    };
    event.locals.member = member;
  }

  return resolve(event);
};

const APP_INSETS_REGEX = /APP-INSETS\s*\(([^)]*)\)/;
const appHandle: Handle = async ({ event, resolve }) => {
  const userAgent = event.request.headers.get("user-agent");
  if (userAgent?.startsWith("DSEK-APP") || env.MOCK_IS_APP === "true") {
    event.locals.isApp = true;
    const insetsJson = APP_INSETS_REGEX.exec(userAgent ?? "")?.[1];
    const insets = JSON.parse(insetsJson ?? "{}");
    event.locals.appInfo = {
      os: userAgent?.substring(10).split(")")[0] ?? undefined,
      insets: {
        top: insets?.top ? Number(insets.top) : 0,
        bottom: insets?.bottom ? Number(insets.bottom) : 0,
        left: insets?.left ? Number(insets.left) : 0,
        right: insets?.right ? Number(insets.right) : 0,
      },
    };
  } else {
    event.locals.isApp = false;
    event.locals.appInfo = undefined;
  }
  return resolve(event);
};

const themeHandle: Handle = async ({ event, resolve }) => {
  let theme = event.cookies.get("theme");

  if (!theme || !themes.includes(theme as Theme)) {
    theme = "dark";
  }
  // get theme from cookies and send to frontend to show correct icon in theme switch
  event.locals.theme = theme as Theme;

  return resolve(event, {
    transformPageChunk: ({ html }) => {
      return html.replace("%theme%", theme);
    },
  });
};

export const handleError: HandleServerError = ({ error }) => {
  return {
    message: error instanceof Error ? error.message : `${error}`,
  };
};

const paraglideHandle: Handle = ({ event, resolve }) =>
  paraglideMiddleware(
    event.request,
    async ({ request: localizedRequest, locale }) => {
      event.request = localizedRequest;

      try {
        // A cheap presence check, not a full identity resolution (that's
        // identityHandle's job, running after this) - just enough to know
        // whether to sync the locale cookie for a logged-in visitor.
        const hasSession = event.cookies.get("dsek_session") !== undefined;
        const existing = event.cookies.get(cookieName);

        // If the server-determined locale exists (from your custom-server strategy)
        // and the user is logged in, set the cookie if it is missing or different.
        if (hasSession && locale && existing !== locale) {
          console.log("hook", locale);
          event.cookies.set(cookieName, locale, {
            path: "/",
            httpOnly: false, // client JS must read it
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 365, // 1 year
          });
        }
      } catch (err) {
        // don't fail the whole request if cookie write or auth check fails
        console.error("paraglide: failed to set locale cookie", err);
      }
      return resolve(event, {
        transformPageChunk: ({ html }) => {
          return html.replace(
            "%lang%",
            (event.locals.member?.language as "sv" | "en" | undefined) ??
              locale,
          );
        },
      });
    },
  );

defineCustomServerStrategy("custom-userPreference", {
  getLocale: async () => {
    const event = getRequestEvent();
    // Same fetchIdentity call identityHandle makes further down the chain -
    // duplicated here since this strategy fires from inside paraglideHandle,
    // which runs before identityHandle populates locals. Not cached across
    // the two; an accepted minor inefficiency, not a correctness gap
    // (fetchIdentity's Set-Cookie forwarding is idempotent either way).
    const identity = await fetchIdentity(event);
    return identity.member?.language ?? undefined;
  },
});

export const handle = sequence(
  async ({ event, resolve }) => {
    const route = event.url.pathname || "-";
    const method = event.request.method;

    inflightRequests.inc();
    const endTimer = httpRequestDurationMs.startTimer({ method, route });
    try {
      // openapi-fetch reads the Content-Length response header on every
      // call (see openapi-fetch/src/index.js) to decide whether to parse
      // an empty body - during SSR, SvelteKit patches Response.headers.get
      // to throw on any header not explicitly allow-listed here (so
      // sensitive headers from a server-side fetch() don't leak into the
      // hydration payload). Go's responses sometimes carry a real
      // Content-Length (buffered) and sometimes don't (chunked), so which
      // pages 500 here is incidental to Go's transfer encoding, not to
      // which load function runs - allow-listing this one non-sensitive
      // header is the actual fix, not a per-route workaround. Per
      // sequence()'s doc comment, filterSerializedResponseHeaders uses
      // whichever handle defines it first in the chain, so it has to live
      // on this outermost handle to take effect at all.
      const response = await resolve(event, {
        filterSerializedResponseHeaders: (name) => name === "content-length",
      });
      const status = String(response.status);
      httpRequestsTotal.inc({ method, route, status_code: status });
      endTimer({ status_code: status });
      return response;
    } finally {
      inflightRequests.dec();
    }
  },
  paraglideHandle,
  identityHandle,
  appHandle,
  themeHandle,
);
