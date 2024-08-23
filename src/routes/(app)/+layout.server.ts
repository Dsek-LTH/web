import { countUserShopItems } from "$lib/server/shop/countUserShopItems";
import { getMyGroupedNotifications } from "$lib/utils/notifications/myNotifications";
import { emptySchema, notificationSchema } from "$lib/zod/schemas";
import type { Alert } from "@prisma/client";
import { loadFlash } from "sveltekit-flash-message/server";
import { zod } from "sveltekit-superforms/adapters";
import { superValidate } from "sveltekit-superforms/server";

const CACHE_TTL = 10 * 60 * 1000; // 10 minutes
const alertsCache: { alerts: Alert[]; lastUpdated: number | null } = {
  alerts: [],
  lastUpdated: null,
};

export const load = loadFlash(async ({ locals, depends }) => {
  const { user, prisma } = locals;

  depends("/api/notifications/my");
  const notifications = user?.memberId
    ? await getMyGroupedNotifications(user, prisma)
    : null;
  depends("cart");
  const shopItemCounts = await countUserShopItems(prisma, user);

  if (
    alertsCache.lastUpdated &&
    Date.now() - alertsCache.lastUpdated > CACHE_TTL
  ) {
    alertsCache.alerts = await prisma.alert.findMany({
      where: {
        removedAt: null,
      },
    });
    alertsCache.lastUpdated = Date.now();
  }

  return {
    alerts: alertsCache.alerts,
    notifications: notifications,
    mutateNotificationForm: await superValidate(zod(notificationSchema)),
    readNotificationForm: await superValidate(zod(emptySchema)),
    shopItemCounts,
  };
});
