import { POST_REVEAL_PREFIX } from "$lib/components/postReveal/types.js";
import { getNollaGroupedNotifications } from "$lib/utils/notifications/nollaNotifications";
import type { Theme } from "$lib/utils/themes";
import { notificationSchema } from "$lib/zod/schemas.js";
import { superValidate } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";

const REVEAL_LAUNCH_DATE = new Date("2024-08-28T16:00:00"); // NEEDS TO BE UPDATED EVERY YEAR

export const load = async ({ locals }) => {
  const { prisma, user } = locals;

  const revealTheme = REVEAL_LAUNCH_DATE <= new Date();
  const notifications = await getNollaGroupedNotifications(user, prisma);

  return {
    revealTheme,
    notifications,
    mutateNotificationForm: await superValidate(zod(notificationSchema)),
    paths: {
      cart: `${POST_REVEAL_PREFIX}/shop/cart`,
      purchaseRedirect: `${POST_REVEAL_PREFIX}/shop/success`,
    },
    theme: (revealTheme ? "nollningPostReveal" : "light") as Theme,
  };
};
