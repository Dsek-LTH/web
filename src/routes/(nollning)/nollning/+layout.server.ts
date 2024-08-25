import {
  POST_REVEAL_PREFIX,
  REVEAL_LAUNCH_DATE,
} from "$lib/components/postReveal/types";
import apiNames from "$lib/utils/apiNames";
import { isAuthorized } from "$lib/utils/authorization";
import { getNollaGroupedNotifications } from "$lib/utils/notifications/nollaNotifications";
import type { Theme } from "$lib/utils/themes";
import { notificationSchema } from "$lib/zod/schemas";
import { superValidate } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";

export const load = async ({ locals }) => {
  const { prisma, user, member } = locals;

  const revealTheme =
    REVEAL_LAUNCH_DATE <= new Date() ||
    isAuthorized(apiNames.MEMBER.SEE_STABEN, user);
  const notifications = getNollaGroupedNotifications(user, prisma);
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

  return {
    revealTheme,
    notifications,
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
