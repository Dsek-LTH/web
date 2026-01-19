import { env } from "$env/dynamic/public";
import { countUserShopItems } from "$lib/server/shop/countUserShopItems";
import { getMyGroupedNotifications } from "$lib/utils/notifications/myNotifications";
import { emptySchema, notificationSchema } from "$lib/zod/schemas";
import { loadFlash } from "sveltekit-flash-message/server";
import { zod4 } from "sveltekit-superforms/adapters";
import { superValidate } from "sveltekit-superforms/server";
import type { ExtendedPrismaModel } from "../../database/prisma/translationExtension";
import type { Member } from "@prisma/client";

const alertsCache: {
  alerts: Array<ExtendedPrismaModel<"Alert"> & { closedByMember: Member[] }>;
  lastUpdated: number | null;
} = {
  alerts: [],
  lastUpdated: null,
};

export const load = loadFlash(async ({ locals, depends }) => {
  depends("/api/notifications/my");
  depends("cart");
  depends("alerts");

  const { user, prisma } = locals;
  const notificationsPromise = user?.memberId
    ? getMyGroupedNotifications(user, prisma)
    : null;
  const shopItemCounts = countUserShopItems(prisma, user);

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
    notificationsPromise,
    mutateNotificationForm: await superValidate(zod4(notificationSchema)),
    readNotificationForm: await superValidate(zod4(emptySchema)),
    shopItemCounts,
  };
});

export type GlobalAppLoadData = Awaited<ReturnType<typeof load>>;

export const ssr = env.PUBLIC_DISABLE_SSR_GLOBALLY === "true" ? false : true;
