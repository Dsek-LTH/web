import authorizedPrismaClient from "$lib/server/shop/authorizedPrisma";
import { countUserShopItems } from "$lib/server/shop/countUserShopItems";
import { CacheDependency } from "$lib/utils/caching/cache";
import { globallyCached, userLevelCached } from "$lib/utils/caching/cached";
import { i18n } from "$lib/utils/i18n";
import { emptySchema, notificationSchema } from "$lib/zod/schemas";
import { loadFlash } from "sveltekit-flash-message/server";
import { superValidate } from "sveltekit-superforms/server";

export const load = loadFlash(async ({ locals, depends, url }) => {
  const { user, prisma } = locals;
  depends("/notifications");
  const notifications = user?.memberId
    ? await userLevelCached(
        user,
        CacheDependency.NOTIFICATIONS,
        (user, prisma) =>
          prisma.notification.findMany({
            where: {
              memberId: user.memberId,
            },
            orderBy: {
              createdAt: "desc", // latest first
            },
          }),
        undefined,
        undefined,
        prisma,
      )
    : null;

  const unreadNotifications = notifications?.filter((n) => n.readAt === null);
  if (
    unreadNotifications &&
    unreadNotifications.length > 0 &&
    unreadNotifications.filter((n) => n.link === i18n.route(url.pathname))
      .length > 0
  ) {
    // mark any notifications pointing to this link as read. Works great for external linking (like notifications).
    await prisma.notification.updateMany({
      where: {
        memberId: user?.memberId,
        link: i18n.route(url.pathname),
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });
  }

  depends("cart");
  const shopItemCounts = await userLevelCached(
    user,
    "shopItems",
    (user, prisma) => countUserShopItems(prisma, user),
    [CacheDependency.CONSUMABLES],
    undefined,
    prisma,
  );
  const alerts = await globallyCached(CacheDependency.ALERTS, () =>
    authorizedPrismaClient.alert.findMany({
      where: {
        removedAt: null,
      },
    }),
  );
  return {
    alerts,
    notifications: notifications,
    deleteNotificationForm: await superValidate(notificationSchema),
    readNotificationForm: await superValidate(emptySchema),
    shopItemCounts,
  };
});
