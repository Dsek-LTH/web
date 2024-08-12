import { POST_REVEAL_PREFIX } from "$lib/components/postReveal/types.js";
import apiNames from "$lib/utils/apiNames.js";
import { isAuthorized } from "$lib/utils/authorization.js";
import { getNollaGroupedNotifications } from "$lib/utils/notifications/nollaNotifications";
import { notificationSchema } from "$lib/zod/schemas.js";
import { error } from "@sveltejs/kit";
import { superValidate } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";

const REVEAL_LAUNCH_DATE = new Date("2024-08-28T15:00:00"); // NEEDS TO BE UPDATED EVERY YEAR

export const load = async ({ locals }) => {
  const { prisma, user } = locals;

  // if not released, only those with access should be able to see post-reveal
  if (
    REVEAL_LAUNCH_DATE > new Date() &&
    !isAuthorized(apiNames.MEMBER.SEE_STABEN, user)
  )
    throw error(401, "Nollningen har inte börjat än.");
  const notifications = await getNollaGroupedNotifications(user, prisma);

  return {
    notifications,
    mutateNotificationForm: await superValidate(zod(notificationSchema)),
    paths: {
      cart: `${POST_REVEAL_PREFIX}/shop/cart`,
      purchaseRedirect: `${POST_REVEAL_PREFIX}/shop/success`,
    },
  };
};
