/* eslint-disable no-restricted-imports -- This is the wrapper that should be used */
import type { ExtendedPrismaModel } from "$lib/server/extendedPrisma";
export { goto } from "$app/navigation";
export { redirect } from "sveltekit-flash-message/server";
/* eslint-enable no-restricted-imports -- Enable again, for eslint */

export const eventLink = (
  event: Pick<ExtendedPrismaModel<"Event">, "id" | "slug">,
) => (event.slug ? `/events/${event.slug}` : `/events/id/${event.id}`);

export const APP_REDIRECT_URL = "dsek://";
