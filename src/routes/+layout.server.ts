import { i18n } from "$lib/utils/i18n";
import { loadFlash } from "sveltekit-flash-message/server";
/**
 * Load the form flash message.
 * Propagates the user and member to the page data.
 */
export const load = loadFlash(async ({ locals, url }) => {
  const { user, member, isApp, appInfo, prisma, theme } = locals;
  if (user?.memberId) {
    // mark any notifications pointing to this link as read. Works great for external linking (like notifications).
    await prisma.notification.updateMany({
      where: {
        memberId: user?.memberId,
        link: i18n.route(url.pathname),
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });
  }

  return {
    user,
    member,
    /**
     * isApp is true when the page is rendered within the native app. This differs from using breakpoint modifiers as the site should look and function differently when it is open in a mobile browser and when it is open in the app.
     * appInfo contains information about the running app, for example the insets for the safe area.
     */
    isApp,
    appInfo,
    theme,
  };
});
