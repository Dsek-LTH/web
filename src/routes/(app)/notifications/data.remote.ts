import { form, getRequestEvent, query } from "$app/server";
import { m } from "$paraglide/messages";
import z from "zod";
import { serverApi } from "$lib/server/apiClient";

// All three now proxy to Go's PATCH /notifications/read / DELETE
// /notifications (backend/internal/api/huma_notifications.go) instead of
// prisma.notification.* directly - see backend/CLAUDE.md's "Notifications
// routes" section.

// Lazily fetched by NotificationBell once opened, `take` grows by one page
// per "load more" - Go returns the grouped page plus whether more exist.
export const getNotifications = query(
  z.object({ take: z.number().int().positive() }),
  async ({ take }) => {
    const event = getRequestEvent();
    if (!event.locals.user?.memberId) {
      return { notifications: [], hasMore: false };
    }
    const res = await serverApi(event).GET("/notifications", {
      params: { query: { take } },
    });
    return res.data ?? { notifications: [], hasMore: false };
  },
);

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
