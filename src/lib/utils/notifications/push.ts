import { dev } from "$app/environment";
import authorizedPrismaClient from "$lib/server/authorizedPrisma";
import {
  Expo,
  type ExpoPushErrorTicket,
  type ExpoPushMessage,
  type ExpoPushTicket,
} from "expo-server-sdk";
import {
  pushNotificationsMessagesTotal,
  pushNotificationsFailedMessagesTotal,
  pushNotificationsChunksFailedTotal,
  pushNotificationSendDurationMs,
} from "$lib/server/metrics";

type TokenAndBadgeCount = {
  token: string;
  unreadNotifications?: number;
};

const isErrorTicket = (ticket: ExpoPushTicket): ticket is ExpoPushErrorTicket =>
  ticket.status === "error";

/** Tokens Expo reports as no longer belonging to an installed app. */
export const getUnregisteredTokens = (tickets: ExpoPushErrorTicket[]) =>
  tickets.flatMap(({ details }) =>
    details?.error === "DeviceNotRegistered" && details.expoPushToken
      ? [details.expoPushToken]
      : [],
  );

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

  // Record attempted messages
  pushNotificationsMessagesTotal.inc(messages.length);

  const endTimer = pushNotificationSendDurationMs.startTimer();
  const chunks = expo.chunkPushNotifications(messages);
  const results = await Promise.allSettled(
    chunks.map((chunk) => expo.sendPushNotificationsAsync(chunk)),
  );
  endTimer();

  // A chunk is rejected as a whole, e.g. when Expo can't be reached
  let failedMessages = 0;
  results.forEach((result, i) => {
    if (result.status === "rejected") {
      pushNotificationsChunksFailedTotal.inc();
      failedMessages += chunks[i]?.length ?? 0;
      console.error("Failed to send push notification chunk", result.reason);
    }
  });

  // An accepted chunk can still contain individual messages that failed
  const errorTickets = results
    .flatMap((result) => (result.status === "fulfilled" ? result.value : []))
    .filter(isErrorTicket);
  failedMessages += errorTickets.length;
  for (const { message, details } of errorTickets) {
    console.error(
      `Push notification failed: ${details?.error ?? "unknown"}: ${message}`,
    );
  }

  if (failedMessages > 0) {
    pushNotificationsFailedMessagesTotal.inc(failedMessages);
    console.error(
      `Failed to send ${failedMessages}/${messages.length} push notifications`,
    );
  }

  const unregisteredTokens = getUnregisteredTokens(errorTickets);
  if (unregisteredTokens.length > 0) {
    await authorizedPrismaClient.expoToken.deleteMany({
      where: { expoToken: { in: unregisteredTokens } },
    });
  }
}

export default sendPushNotifications;
