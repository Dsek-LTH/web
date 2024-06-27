import { loadFlash } from "sveltekit-flash-message/server";
/**
 * Load the form flash message.
 * Propagates the user and member to the page data.
 */
export const load = loadFlash(async ({ locals }) => {
  const { user, member, isApp, appInfo } = locals;
  return {
    user,
    member,
    /**
     * isApp is true when the page is rendered within the native app. This differs from using breakpoint modifiers as the site should look and function differently when it is open in a mobile browser and when it is open in the app.
     * appInfo contains information about the running app, for example the insets for the safe area.
     */
    isApp,
    appInfo,
  };
});
