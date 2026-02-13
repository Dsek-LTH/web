import { z } from "zod";
import { form, getRequestEvent } from "$app/server";
import { NotificationSettingType } from "$lib/utils/notifications/types";

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

export const updateSettings = form(settingsSchema, async (data) => {
  const { user, prisma } = getRequestEvent().locals;
  if (!user) return { message: "401 Unauthorized", success: false };

  // Extract subscription types that are enabled
  const subscriptions: NotificationSettingType[] = [];
  const pushNotifications: NotificationSettingType[] = [];

  const settings = data;

  Object.values(NotificationSettingType).forEach((settingType) => {
    if (settings[`subscription_${settingType}`]) {
      subscriptions.push(settingType);
    }
    if (settings[`push_${settingType}`]) {
      pushNotifications.push(settingType);
    }
  });

  // Try-catch if for some reason form data isn't correct
  try {
    await prisma.$transaction(async (tx) => {
      // Delete all existing subscription settings for this user
      await tx.subscriptionSetting.deleteMany({
        where: {
          memberId: user.memberId,
        },
      });

      // Create new subscription settings
      if (subscriptions.length > 0) {
        await tx.subscriptionSetting.createMany({
          data: subscriptions.map((type) => ({
            memberId: user.memberId as string,
            type: type,
            pushNotification: pushNotifications.includes(type),
          })),
        });
      }
    });

    await prisma.member.update({
      where: {
        id: user.memberId as string,
      },
      data: {
        subscribedTags: {
          set: data.tags.map((tag) => ({ id: tag })),
        },
      },
    });
  } catch (err) {
    console.error("Error updating notification settings:", err);
    return { message: "Failed updating settings: " + err, success: false };
  }
  return { message: "Updated settings", success: true };
});
