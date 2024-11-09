import { dev } from "$app/environment";
import type { NotificationSettingType } from "$lib/utils/notifications/types";
import { error } from "@sveltejs/kit";
import { Expo, type ExpoPushMessage } from "expo-server-sdk";

async function sendPushNotifications(
  tokens: string[],
  title: string,
  body: string,
  type: NotificationSettingType,
  link: string,
) {
  if (dev) return;

  const expo = new Expo();

  const messages: ExpoPushMessage[] = tokens
    .filter((token) => Expo.isExpoPushToken(token))
    .map((token) => ({
      to: token,
      title,
      body,
      channelId: type,
      data: { link },
    }));
  if (messages.length === 0) {
    return;
  }

  const chunks = expo.chunkPushNotifications(messages);
  const results = await Promise.allSettled(
    chunks.map((chunk) => expo.sendPushNotificationsAsync(chunk)),
  );
  const failedMessages = results
    .map((r, i) => [r, i] as const)
    .filter(([result]) => result.status === "rejected")
    .flatMap(([, i]) => chunks[i]).length;
  if (failedMessages) {
    console.error(`Failed to send ${failedMessages} push notifications`);
  }
  if (failedMessages === messages.length) {
    throw error(500, "Failed to send push notifications");
  }
}

export default sendPushNotifications;
