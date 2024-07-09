import { countUserShopItems } from "$lib/server/shop/countUserShopItems";
import type { NotificationGroup } from "$lib/utils/notifications/group";
import { emptySchema, notificationSchema } from "$lib/zod/schemas";
import { loadFlash } from "sveltekit-flash-message/server";
import { superValidate } from "sveltekit-superforms/server";

export const load = loadFlash(async ({ locals, depends, request, fetch }) => {
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
  const notifications = user?.memberId
    ? await fetch("/api/notifications/my").then(
        (res) => res.json() as Promise<NotificationGroup[]>,
      )
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
    deleteNotificationForm: await superValidate(notificationSchema),
    readNotificationForm: await superValidate(emptySchema),
    shopItemCounts,
  };
});
