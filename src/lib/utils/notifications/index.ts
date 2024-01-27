import sendPushNotifications from "$lib/utils/notifications/push";
import {
  NotificationType,
  SUBSCRIPTION_SETTINGS_MAP,
  type NotificationSettingType,
} from "$lib/utils/notifications/types";
import type { Author, PrismaClient } from "@prisma/client";
import { error } from "@sveltejs/kit";

const DUPLICATE_ALLOWED_TYPES = [
  NotificationType.CREATE_MANDATE,
  NotificationType.ARTICLE_UPDATE,
  NotificationType.BOOKING_REQUEST,
];

type SendNotificationProps = {
  title: string;
  message: string;
  type: NotificationType;
  link: string;
  memberIds?: string[];
  fromAuthor?: Author;
  fromMemberId?: string;
};

/**
 *
 * @param title
 * @param message
 * @param type NotificationType
 * @param link used when notification is clicked
 * @param memberIds if no memberId is input then it will send to all users
 * @param fromAuthor (optional)
 * @param fromMemberId (optional), if fromAuthor is not given, use this member id to find/create author
 */
const sendNotification = async (
  prisma: PrismaClient,
  {
    title,
    message,
    type,
    link,
    memberIds,
    fromAuthor,
    fromMemberId,
  }: SendNotificationProps,
) => {
  // Find corresponding setting type, example "COMMENT" for "EVENT_COMMENT"
  const settingType: NotificationSettingType = (Object.entries(
    SUBSCRIPTION_SETTINGS_MAP,
  ).find(([, internalTypes]) => internalTypes.includes(type))?.[0] ??
    type) as NotificationSettingType;
  // Who sent the notification, as an Author
  const existingAuthor =
    fromAuthor ??
    (await prisma.author.findFirst({
      where: { memberId: fromMemberId, mandateId: null, customId: null },
    }));
  const notificationAuthor =
    existingAuthor ?? fromMemberId
      ? await prisma.author.create({
          data: { memberId: fromMemberId! },
        })
      : undefined;
  const shouldReceiveDuplicates = DUPLICATE_ALLOWED_TYPES.includes(type); // if the notification type allows for duplicates

  const receivingMembers = await prisma.member.findMany({
    where: {
      subscriptionSettings: {
        some: {
          type: settingType,
        },
      },
      notifications: shouldReceiveDuplicates
        ? undefined
        : {
            none: {
              type,
              link,
              fromAuthorId: notificationAuthor?.id,
            },
          },
      id: {
        not: notificationAuthor?.memberId,
        ...(memberIds !== undefined && memberIds.length > 0
          ? { in: memberIds }
          : {}),
      },
    },
    select: {
      id: true,
      subscriptionSettings: {
        where: {
          type,
        },
        select: {
          pushNotification: true,
        },
      },
    },
  });
  console.log(
    `Sending ${type} notification to ${receivingMembers.length} members${
      notificationAuthor
        ? `, sent from author:${notificationAuthor.id} [${notificationAuthor.type}, member: ${notificationAuthor.memberId}]`
        : ""
    }`,
  );

  const pushNotificationMembers = receivingMembers.filter((s) =>
    s.subscriptionSettings.some((ss) => ss.pushNotification),
  );
  const pushTokens = await prisma.expoToken.findMany({
    where: {
      memberId: {
        in: pushNotificationMembers.map((m) => m.id),
      },
    },
    select: {
      expoToken: true,
    },
  });
  const [pushResult, databaseResult] = await Promise.allSettled([
    sendPushNotifications(
      pushTokens.map((t) => t.expoToken!),
      title,
      message,
      settingType,
      link,
    ),
    await prisma.notification.createMany({
      data: receivingMembers.map(({ id: memberId }) => ({
        title,
        message,
        type,
        link,
        memberId,
        fromAuthorId: fromAuthor?.id,
      })),
    }),
  ]);
  if (
    pushResult.status === "rejected" &&
    databaseResult.status === "rejected"
  ) {
    throw error(500, "Failed to send notifications");
  }
  if (pushResult.status === "rejected") {
    throw error(500, "Failed to send push notifications");
  }
  if (databaseResult.status === "rejected") {
    throw error(500, "Failed to save notifications to database");
  }
};

export default sendNotification;
