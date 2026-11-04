import type { components } from "$lib/api/schema";

/**
 * The user-facing notification toggles shown on /settings - Go's
 * NotificationSettingType enum (backend/internal/notifications.SettingType),
 * with a runtime list of its values for the settings form.
 */
export type NotificationSettingType =
  components["schemas"]["NotificationSettingType"];

export const NotificationSettingType = {
  LIKE: "LIKE",
  COMMENT: "COMMENT",
  MENTION: "MENTION",
  NEW_ARTICLE: "NEW_ARTICLE",
  EVENT_GOING: "EVENT_GOING",
  CREATE_MANDATE: "CREATE_MANDATE",
  BOOKING_REQUEST: "BOOKING_REQUEST",
  PING: "PING",
} as const satisfies Record<string, NotificationSettingType>;

const settingTypes: readonly string[] = Object.values(NotificationSettingType);

export const isNotificationSettingType = (
  value: string,
): value is NotificationSettingType => settingTypes.includes(value);
