import { form, getRequestEvent } from "$app/server";
import { m } from "$paraglide/messages";
import z from "zod";

export const readAllNotifications = form(z.object({}), async () => {
  const { user, prisma } = getRequestEvent().locals;
  if (!user?.memberId) {
    return {
      message: m.notifications_errors_notLoggedIn(),
      type: "error" as const,
    };
  }
  await prisma.notification.updateMany({
    where: {
      memberId: user.memberId,
      readAt: null,
    },
    data: {
      readAt: new Date(),
    },
  });
  return {
    message: m.notifications_notificationsRead(),
    type: "hidden" as const,
  };
});

export const deleteAllNotifications = form(z.object({}), async () => {
  const { user, prisma } = getRequestEvent().locals;
  if (!user?.memberId) {
    return {
      message: m.notifications_errors_notLoggedIn(),
      type: "error" as const,
    };
  }
  await prisma.notification.deleteMany({
    where: {
      memberId: user.memberId,
    },
  });
  return {
    message: m.notifications_notificationsRemoved(),
    type: "success" as const,
  };
});

export const deleteNotification = form(
  z.object({
    notificationId: z
      .string()
      .optional()
      .transform((val) => (val !== undefined ? Number(val) : undefined)),
    notificationIds: z
      .string()
      .optional()
      .transform((val) => (val ? val.split(",").map(Number) : [])),
  }),
  async (data) => {
    const { user, prisma } = getRequestEvent().locals;
    if (data.notificationIds.length > 0) {
      await prisma.notification.deleteMany({
        where: {
          memberId: user!.memberId,
          id: {
            in: data.notificationIds,
          },
        },
      });
      return {
        message: m.notifications_notificationsRemoved(),
        type: "success" as const,
      };
    } else if (data.notificationId) {
      await prisma.notification.delete({
        where: {
          memberId: user!.memberId,
          id: data.notificationId,
        },
      });
      return {
        message: m.notifications_notificationRemoved(),
        type: "success" as const,
      };
    }
    return {
      message: m.notifications_errors_couldNotRemove(),
      type: "error" as const,
    };
  },
);
