import { countUserShopItems } from "$lib/server/shop/countUserShopItems";
import { getMyGroupedNotifications } from "$lib/utils/notifications/myNotifications";
import { emptySchema, notificationSchema } from "$lib/zod/schemas";
import { loadFlash } from "sveltekit-flash-message/server";
import { superValidate } from "sveltekit-superforms/server";
import { zod } from "sveltekit-superforms/adapters";

export const load = loadFlash(async ({ locals, depends, request }) => {
  const { user, prisma } = locals;
  if (user?.memberId) {
    // mark any notifications pointing to this link as read. Works great for external linking (like notifications).
    await prisma.notification.updateMany({
      where: {
        memberId: user?.memberId,
        link: new URL(request.url).pathname,
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });
  }
  depends("/api/notifications/my");
  const notifications = user?.memberId
    ? await getMyGroupedNotifications(user, prisma)
    : null;
  depends("cart");
  const shopItemCounts = await countUserShopItems(prisma, user);
  const alerts = await prisma.alert.findMany({
    where: {
      removedAt: null,
    },
  });
  return {
    alerts,
    notifications: notifications,
    deleteNotificationForm: await superValidate(zod(notificationSchema)),
    readNotificationForm: await superValidate(zod(emptySchema)),
    shopItemCounts,
  };
});
