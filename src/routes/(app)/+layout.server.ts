import { env } from "$env/dynamic/public";
import { countUserShopItems } from "$lib/server/shop/countUserShopItems";
import { getMyGroupedNotifications } from "$lib/utils/notifications/myNotifications";
import { emptySchema, notificationSchema } from "$lib/zod/schemas";
import type { Alert } from "@prisma/client";
import { loadFlash } from "sveltekit-flash-message/server";
import { zod } from "sveltekit-superforms/adapters";
import { superValidate } from "sveltekit-superforms/server";
import { tracer } from "../../hooks.server";
import { createCache } from "cache-manager";

const cache = createCache();

export const load = loadFlash(async ({ locals, depends }) => {
  const { notificationsPromise, shopItemCounts, alerts } = await tracer.startActiveSpan(
    "layout.server.ts",
    async (span) => {
      const { user, prisma } = locals;

      depends("/api/notifications/my");
      const notificationsPromise = user?.memberId
        ? await getMyGroupedNotifications(user, prisma)
        : null;
      depends("cart");
      const shopItemCounts = countUserShopItems(prisma, user);

      let alerts = await cache.get("alerts");
      if (alerts === null) {
        alerts = await prisma.alert.findMany({
          where: {
            removedAt: null,
          },
        });
        cache.set("alerts", alerts), 10 * 60 * 1000;
      }
      span.end();

      return { notificationsPromise, shopItemCounts, alerts };
    },
  );

  return {
    alerts,
    notificationsPromise,
    mutateNotificationForm: await superValidate(zod(notificationSchema)),
    readNotificationForm: await superValidate(zod(emptySchema)),
    shopItemCounts,
  };
});
export type GlobalAppLoadData = Awaited<ReturnType<typeof load>>;

export const ssr = env.PUBLIC_DISABLE_SSR_GLOBALLY === "true" ? false : true;
