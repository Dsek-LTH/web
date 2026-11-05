import { z } from "zod";
import { form, getRequestEvent } from "$app/server";
import { NotificationSettingType } from "$lib/notifications/settingTypes";
import { serverApi } from "$lib/server/apiClient";

// Create a schema for notification settings dynamically
// Optional because unchecked switches aren't part of the submitted form. Typed
// as a boolean since form() doesn't accept undefined in an index signature.
const switchField = z
  .string()
  .optional()
  .transform(Boolean) as unknown as z.ZodBoolean;
const schemaFields: Record<string, z.ZodBoolean> = {};

Object.values(NotificationSettingType).forEach((settingType) => {
  schemaFields[`subscription_${settingType}`] = switchField;
  schemaFields[`push_${settingType}`] = switchField;
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
// apps/api/internal/api/huma_notifications.go) instead of a
// prisma.$transaction + prisma.member.update pair.
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
