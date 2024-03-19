import { loadFlash } from "sveltekit-flash-message/server";
/**
 * Load the form flash message.
 * Propagates the user and member to the page data.
 */
export const load = loadFlash(async ({ locals }) => {
  const { user, member } = locals;
  return { user, member };
});
