import { loadFlash } from "sveltekit-flash-message/server";

/**
 * Load the form flash message.
 * Propagates the user and member to the page data.
 */
export const load = loadFlash(async ({ locals }) => {
  const { user, member, prisma } = locals;
  return {
    user,
    member,
    notifications: user
      ? await prisma.notification.findMany({
          where: {
            memberId: user?.memberId,
          },
        })
      : [],
  };
});
