import { form, getRequestEvent } from "$app/server";
import { m } from "$paraglide/messages";
import z from "zod";
import { serverApi } from "$lib/server/apiClient";

// All three now proxy to Go's PATCH /notifications/read / DELETE
// /notifications (backend/internal/api/huma_notifications.go) instead of
// prisma.notification.* directly - see backend/CLAUDE.md's "Notifications
// routes" section.

export const readAllNotifications = form(z.object({}), async () => {
  const event = getRequestEvent();
  if (!event.locals.user?.memberId) {
    return {
      message: m.notifications_errors_notLoggedIn(),
      type: "error" as const,
    };
  }
  await serverApi(event).PATCH("/notifications/read", {});
  return {
    message: m.notifications_notificationsRead(),
    type: "hidden" as const,
  };
});

export const deleteAllNotifications = form(z.object({}), async () => {
  const event = getRequestEvent();
  if (!event.locals.user?.memberId) {
    return {
      message: m.notifications_errors_notLoggedIn(),
      type: "error" as const,
    };
  }
  await serverApi(event).DELETE("/notifications", {});
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
    const event = getRequestEvent();
    const api = serverApi(event);
    if (data.notificationIds.length > 0) {
      await api.DELETE("/notifications", {
        params: { query: { ids: data.notificationIds } },
      });
      return {
        message: m.notifications_notificationsRemoved(),
        type: "success" as const,
      };
    } else if (data.notificationId) {
      await api.DELETE("/notifications", {
        params: { query: { id: data.notificationId } },
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
