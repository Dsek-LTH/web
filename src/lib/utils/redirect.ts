import { i18n } from "$lib/utils/i18n";
/* eslint-disable no-restricted-imports -- This is the wrapper that should be used */
import { goto as rawGoto } from "$app/navigation";
import { redirect as rawRedirect } from "sveltekit-flash-message/server";
import type { Event } from "@prisma/client";
/* eslint-enable no-restricted-imports -- Enable again, for eslint */

export const goto: typeof rawGoto = (url, opts) => {
  if (typeof url === "string" && url.startsWith("/")) {
    return rawGoto(i18n.resolveRoute(url), opts);
  }
  if (url instanceof URL) {
    return rawGoto(i18n.resolveRoute(url.pathname), opts);
  }
  return rawGoto(i18n.resolveRoute(url), opts);
};

/* eslint-disable @typescript-eslint/no-explicit-any -- rawRedirect has difficult typings */
export const redirect: typeof rawRedirect = ((...args) => {
  const [location, message, event] = args;
  if (typeof location === "string" && location.startsWith("/")) {
    return rawRedirect(
      i18n.resolveRoute(location) as any,
      message as Message | undefined,
      event as any,
    );
  } else if (location instanceof URL) {
    return rawRedirect(
      i18n.resolveRoute(location.pathname) as any,
      message as Message | undefined,
      event as any,
    );
  } else {
    return rawRedirect(...(args as Parameters<typeof rawRedirect>));
  }
}) as typeof rawRedirect;
/* eslint-enable @typescript-eslint/no-explicit-any -- Enable again, for eslint*/

export const eventLink = (event: Pick<Event, "id" | "slug">) =>
  event.slug ? `/events/${event.slug}` : `/events/id/${event.id}`;
