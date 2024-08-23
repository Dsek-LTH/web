import { loadFlash } from "sveltekit-flash-message/server";
/**
 * Load the form flash message.
 * Propagates the user and member to the page data.
 */
export const load = loadFlash(async ({ locals }) => {
  const { user, member, isApp, appInfo, theme } = locals;

  // SUSPECTED SLOW CODE
  // if (user?.memberId) {
  //   // mark any notifications pointing to this link as read. Works great for external linking (like notifications).
  //   await prisma.notification.updateMany({
  //     where: {
  //       memberId: user?.memberId,
  //       link: i18n.route(url.pathname),
  //       readAt: null,
  //     },
  //     data: {
  //       readAt: new Date(),
  //     },
  //   });
  // }

  return {
    user,
    member,
    theme,
    /**
     * isApp is true when the page is rendered within the native app. This
     * differs from using breakpoint modifiers as the site should look and
     * function differently when it is open in a mobile browser and when
     * it is open in the app.
     */
    isApp,
    /** appInfo contains information about the running app, for example the insets for the safe area. */
    appInfo,
  };
});
