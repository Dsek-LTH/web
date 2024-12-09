import {
  APP_PREFERRED_PAGE_COOKIE,
  POST_REVEAL_PREFIX,
  REVEAL_LAUNCH_DATE,
} from "$lib/components/postReveal/types";
import { getNollaGroupedNotifications } from "$lib/utils/notifications/nollaNotifications";
import type { Theme } from "$lib/utils/themes";
import { notificationSchema } from "$lib/zod/schemas";
import { superValidate } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";

const afterNollning = new Date("2024-10-06");
export const load = async ({ locals, cookies }) => {
  const { prisma, user, member } = locals;

  const revealTheme = REVEAL_LAUNCH_DATE <= new Date();
  const notificationsPromise = getNollaGroupedNotifications(user, prisma);
  const phadderGroup =
    member?.classYear == new Date().getFullYear() &&
    member.nollningGroupId !== null
      ? prisma.phadderGroup.findUnique({
          where: {
            id: member.nollningGroupId!,
          },
          select: {
            name: true,
          },
        })
      : null;

  if (locals.isApp)
    cookies.set(APP_PREFERRED_PAGE_COOKIE, "nollning", {
      path: "/",
      expires: afterNollning,
    });

  return {
    revealTheme,
    notificationsPromise,
    mutateNotificationForm: await superValidate(zod(notificationSchema)),
    paths: {
      cart: `${POST_REVEAL_PREFIX}/shop/cart`,
      purchaseRedirect: `${POST_REVEAL_PREFIX}/shop/success`,
    },
    phadderGroup,
    theme: (revealTheme ? "nollningPostReveal" : "light") as Theme,
  };
};

export type PostRevealLayoutData = Awaited<ReturnType<typeof load>>;
