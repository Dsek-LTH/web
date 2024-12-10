import { dev } from "$app/environment";
import { error } from "@sveltejs/kit";
import { Expo, type ExpoPushMessage } from "expo-server-sdk";

type TokenAndBadgeCount = {
  token: string;
  unreadNotifications?: number;
};
async function sendPushNotifications(
  tokens: TokenAndBadgeCount[],
  title: string,
  body: string,
  link: string,
) {
  if (dev) return;

  const expo = new Expo();

  const messages: ExpoPushMessage[] = tokens
    .filter(({ token }) => Expo.isExpoPushToken(token))
    .map(({ token, unreadNotifications }) => ({
      to: token,
      title,
      body,
      channelId: "default",
      data: { link },
      sound: "default",
      priority: "high",
      badge: unreadNotifications ?? 0,
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
