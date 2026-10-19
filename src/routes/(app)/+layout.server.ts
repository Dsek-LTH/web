import { env } from "$env/dynamic/public";
import { getUnreadNotificationCount } from "$lib/utils/notifications/myNotifications";
import { emptySchema, notificationSchema } from "$lib/zod/schemas";
import { loadFlash } from "sveltekit-flash-message/server";
import { zod4 } from "sveltekit-superforms/adapters";
import { superValidate } from "sveltekit-superforms/server";
import type { ExtendedPrismaModel } from "$database/prisma/translationExtension";
import type { Member } from "@prisma/client";

const alertsCache: {
  alerts: Array<ExtendedPrismaModel<"Alert"> & { closedByMember: Member[] }>;
  lastUpdated: number | null;
} = {
  alerts: [],
  lastUpdated: null,
};

export const load = loadFlash(async ({ locals, depends }) => {
  depends("alerts");

  const { prisma, user } = locals;
  const unreadCountPromise = user?.memberId
    ? getUnreadNotificationCount(user, prisma)
    : undefined;

  alertsCache.alerts = await prisma.alert.findMany({
    where: {
      removedAt: null,
    },
    include: {
      closedByMember: true,
    },
  });
  alertsCache.lastUpdated = Date.now();

  return {
    alerts: alertsCache.alerts,
    unreadCountPromise,
    mutateNotificationForm: await superValidate(zod4(notificationSchema)),
    readNotificationForm: await superValidate(zod4(emptySchema)),
  };
});

export type GlobalAppLoadData = Awaited<ReturnType<typeof load>>;

export const ssr = env.PUBLIC_DISABLE_SSR_GLOBALLY === "true" ? false : true;
