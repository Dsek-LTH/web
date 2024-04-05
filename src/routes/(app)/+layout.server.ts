import { emptySchema, notificationSchema } from "$lib/zod/schemas";
import { loadFlash } from "sveltekit-flash-message/server";
import { superValidate } from "sveltekit-superforms/server";

export const load = loadFlash(async ({ locals, depends, request }) => {
  const { user, prisma } = locals;
  depends("/notifications");
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
    ? await prisma.notification.findMany({
        where: {
          memberId: user.memberId,
        },
        orderBy: {
          createdAt: "desc", // latest first
        },
      })
    : null;
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
  };
});
