import { env } from "$env/dynamic/private";
import { createMember } from "$lib/utils/member";
import { themes, type Theme } from "$lib/utils/themes";
import {
  cookieName,
  defineCustomServerStrategy,
  getLocale,
} from "$paraglide/runtime";
import authorizedPrismaClient from "$lib/server/authorizedPrisma";
import { fetchIdentity } from "$lib/server/goAuth";
import {
  error,
  redirect,
  type Handle,
  type HandleServerError,
} from "@sveltejs/kit";
import { sequence } from "@sveltejs/kit/hooks";
import { enhance } from "@zenstackhq/runtime";
import RPCApiHandler from "@zenstackhq/server/api/rpc";
import zenstack from "@zenstackhq/server/sveltekit";
import { randomBytes } from "crypto";
import {
  PrismaClientKnownRequestError,
  PrismaClientValidationError,
} from "@prisma/client/runtime/library";
import { verifyCostCenterData } from "./routes/(app)/expenses/verification";
import { getExtendedPrismaClient } from "$lib/server/extendedPrisma";
import { dev } from "$app/environment";
import { paraglideMiddleware } from "$paraglide/server";
import { getRequestEvent } from "$app/server";
import {
  httpRequestsTotal,
  httpRequestDurationMs,
  inflightRequests,
} from "$lib/server/metrics";

// TODO: This function should perhaps only be called during dev? Build? I'm not sure
if (dev) verifyCostCenterData();

// Identity/session resolution (login, refresh, roles/policies) is now owned
// entirely by the Go backend (backend/internal/auth) - see
// backend/DESIGN.md's Auth section. This handle just asks Go who the caller
// is (via the shared dsek_session cookie) and builds locals.user/locals.prisma
// from that, the same shape the old Auth.js-based version produced.
const databaseHandle: Handle = async ({ event, resolve }) => {
  const identity = await fetchIdentity(event);

  if (!identity.studentId) {
    const prisma = getExtendedPrismaClient(getLocale(), undefined);
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
    const user = {
      studentId: undefined,
      memberId: undefined,
      policies: identity.policies,
      externalCode: externalCode, // For anonymous users
      roles: identity.roles,
    };
    event.locals.prisma = enhance(prisma, {
      user,
    });
    event.locals.user = user;
  } else {
    const prisma = getExtendedPrismaClient(getLocale(), identity.studentId);
    const existingMember = await authorizedPrismaClient.member.findUnique({
      where: { studentId: identity.studentId },
    });
    // Go's /auth/callback already resolves-or-creates the Member row on
    // login (see backend/internal/auth's resolveOrCreateMember) - this
    // fallback only matters if that's ever bypassed (e.g. AUTH_MOCK), and
    // deliberately uses the full createMember (subscription defaults, tag
    // subscriptions) that Go's minimal port doesn't replicate - see
    // DESIGN.md's Auth section for that gap.
    const member =
      existingMember ||
      (await createMember(prisma, {
        studentId: identity.studentId,
        firstName: identity.givenName,
        lastName: identity.familyName,
        email: identity.email,
      }));

    if (
      event.url.pathname != "/onboarding" &&
      (!member.classProgramme || !member.classYear) // consider adding email here, but make sure to fix onboarding as well
    ) {
      redirect(302, "/onboarding");
    }

    const user = {
      studentId: identity.studentId,
      memberId: identity.memberId,
      policies: identity.policies,
      roles: identity.roles,
    };

    event.locals.prisma = enhance(prisma, { user });
    event.locals.user = user;
    event.locals.member = member!;
  }

  return resolve(event);
};

const apiHandle = zenstack.SvelteKitHandler({
  prefix: "/api/model",
  getPrisma: (event) => event.locals.prisma,
  handler: (req) => {
    if (req.method !== "GET") error(403); // until we have proper field-level policies, only allow reads
    return RPCApiHandler()(req);
  },
});

const APP_INSETS_REGEX = /APP-INSETS\s*\(([^)]*)\)/;
const appHandle: Handle = async ({ event, resolve }) => {
  const userAgent = event.request.headers.get("user-agent");
  if (userAgent?.startsWith("DSEK-APP") || env.MOCK_IS_APP === "true") {
    event.locals.isApp = true;
    const insetsJson = APP_INSETS_REGEX.exec(userAgent ?? "")?.[1];
    const insets = JSON.parse(insetsJson ?? "{}");
    event.locals.appInfo = {
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
  if (error instanceof PrismaClientKnownRequestError) {
    const { message, name, code } = error;
    console.log("prisma known request error", { message, name, code });
    return {
      message: message,
    };
  } else if (error instanceof PrismaClientValidationError) {
    console.error("prisma validation error", error.message, error.name);
    return {
      message: "Database validation error, see logs for more info",
    };
  }
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
        // databaseHandle's job, running after this) - just enough to know
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
            (event.locals.member?.language as "sv" | "en") ?? locale,
          );
        },
      });
    },
  );

defineCustomServerStrategy("custom-userPreference", {
  getLocale: async () => {
    const event = getRequestEvent();
    // Same fetchIdentity call databaseHandle makes further down the chain -
    // duplicated here since this strategy fires from inside paraglideHandle,
    // which runs before databaseHandle populates locals.user. Not cached
    // across the two; an accepted minor inefficiency, not a correctness gap
    // (fetchIdentity's Set-Cookie forwarding is idempotent either way).
    const identity = await fetchIdentity(event);
    if (identity.studentId) {
      const lang = await authorizedPrismaClient.member.findFirst({
        where: { studentId: identity.studentId },
        select: { language: true },
      });
      return lang?.language ?? undefined;
    }
    return undefined;
  },
});

export const handle = sequence(
  async ({ event, resolve }) => {
    const route = event.url.pathname || "-";
    const method = event.request.method;

    inflightRequests.inc();
    const endTimer = httpRequestDurationMs.startTimer({ method, route });
    try {
      const response = await resolve(event);
      const status = String(response.status);
      httpRequestsTotal.inc({ method, route, status_code: status });
      endTimer({ status_code: status });
      return response;
    } finally {
      inflightRequests.dec();
    }
  },
  paraglideHandle,
  databaseHandle,
  apiHandle,
  appHandle,
  themeHandle,
);
