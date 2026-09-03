import { z } from "zod";
import { form, getRequestEvent } from "$app/server";
import { NotificationSettingType } from "$lib/notifications/settingTypes";
import { serverApi } from "$lib/server/apiClient";

// Create a schema for notification settings dynamically
// Using z.coerce.boolean() with optional to handle unchecked checkboxes
const schemaFields: Record<string, z.ZodBoolean> = {};

Object.values(NotificationSettingType).forEach((settingType) => {
  schemaFields[`subscription_${settingType}`] = z.coerce.boolean();
  schemaFields[`push_${settingType}`] = z.coerce.boolean();
});

const settingsSchema = z.object(schemaFields).and(
  z.object({
    tags: z
      .string()
      .transform((val) => {
        try {
          return JSON.parse(val);
        } catch {
          return [];
        }
      })
      .pipe(z.array(z.string())),
  }),
);

// Now a thin proxy to Go's PUT /notification-settings (full-replace,
// backend/internal/api/huma_notifications.go) instead of a
// prisma.$transaction + prisma.member.update pair - see
// backend/CLAUDE.md's "Notifications routes" section.
export const updateSettings = form(settingsSchema, async (data) => {
  const event = getRequestEvent();
  if (!event.locals.user) {
    return { message: "401 Unauthorized", type: "error" as const };
  }

  const subscriptions: NotificationSettingType[] = [];
  const pushSubscriptions: NotificationSettingType[] = [];
  Object.values(NotificationSettingType).forEach((settingType) => {
    if (data[`subscription_${settingType}`]) {
      subscriptions.push(settingType);
    }
    if (data[`push_${settingType}`]) {
      pushSubscriptions.push(settingType);
    }
  });

  const res = await serverApi(event).PUT("/notification-settings", {
    body: {
      subscriptions,
      pushSubscriptions,
      subscribedTagIds: data.tags,
    },
  });
  if (res.error) {
    return { message: "Failed updating settings", type: "error" as const };
  }
  return { message: "Updated settings", type: "success" as const };
});
