import { notificationSchema } from "$lib/zod/schemas";
import { loadFlash } from "sveltekit-flash-message/server";
import { superValidate } from "sveltekit-superforms/server";

export const load = loadFlash(async ({ locals, depends }) => {
  const { user, member, prisma } = locals;
  depends("/notifications");
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
  return {
    notifications: notifications,
    deleteNotificationForm: await superValidate(notificationSchema),
  };
});
