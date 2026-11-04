import * as m from "$paraglide/messages";
import { error, redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

/**
 * The HTML itself is served by the 2026/+server.ts endpoint. Errors from
 * endpoints don't render +error.svelte, so the login check happens here to
 * show logged out users the normal error page with navigation.
 */
export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user?.memberId) {
    error(401, m.members_errors_notLoggedIn());
  }
  redirect(302, "/dcompassen/2026");
};
