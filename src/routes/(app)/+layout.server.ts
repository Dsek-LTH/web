import { env } from "$env/dynamic/public";
import { countUserShopItems } from "$lib/server/shop/countUserShopItems";
import { getMyGroupedNotifications } from "$lib/utils/notifications/myNotifications";
import { emptySchema, notificationSchema } from "$lib/zod/schemas";
import type { Alert } from "@prisma/client";
import { loadFlash } from "sveltekit-flash-message/server";
import { zod } from "sveltekit-superforms/adapters";
import { superValidate } from "sveltekit-superforms/server";
import { tracer } from "../../hooks.server";

const CACHE_TTL = 10 * 60 * 1000; // 10 minutes
const alertsCache: { alerts: Alert[]; lastUpdated: number | null } = {
  alerts: [],
  lastUpdated: null,
};
const hasCacheExpired = (cache: typeof alertsCache) =>
  !cache.lastUpdated || // no cache
  Date.now() - cache.lastUpdated > CACHE_TTL;

export const load = loadFlash(async ({ locals, depends }) => {
  const { notificationsPromise, shopItemCounts } = await tracer.startActiveSpan(
    "layout.server.ts",
    async (span) => {
      const { user, prisma } = locals;

      depends("/api/notifications/my");
      const notificationsPromise = user?.memberId
        ? getMyGroupedNotifications(user, prisma)
        : null;
      depends("cart");
      const shopItemCounts = countUserShopItems(prisma, user);

      if (hasCacheExpired(alertsCache)) {
        alertsCache.alerts = await prisma.alert.findMany({
          where: {
            removedAt: null,
          },
        });
        alertsCache.lastUpdated = Date.now();
      }
      span.end();

      return { notificationsPromise, shopItemCounts };
    },
  );

  return {
    alerts: alertsCache.alerts,
    notificationsPromise,
    mutateNotificationForm: await superValidate(zod(notificationSchema)),
    readNotificationForm: await superValidate(zod(emptySchema)),
    shopItemCounts,
  };
});
export type GlobalAppLoadData = Awaited<ReturnType<typeof load>>;

export const ssr = env.PUBLIC_DISABLE_SSR_GLOBALLY === "true" ? false : true;
