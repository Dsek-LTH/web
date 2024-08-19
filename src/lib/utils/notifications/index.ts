import authorizedPrismaClient from "$lib/server/shop/authorizedPrisma";
import sendPushNotifications from "$lib/utils/notifications/push";
import {
  NotificationSettingType,
  NotificationType,
  SUBSCRIPTION_SETTINGS_MAP,
} from "$lib/utils/notifications/types";
import {
  type Author,
  type Member,
  type SubscriptionSetting,
} from "@prisma/client";
import { error } from "@sveltejs/kit";

const DUPLICATE_ALLOWED_TYPES = [
  NotificationType.CREATE_MANDATE,
  NotificationType.ARTICLE_REQUEST_UPDATE,
  NotificationType.BOOKING_REQUEST,
  NotificationType.PAYMENT_STATUS,
];

type BaseSendNotificationProps = {
  title: string;
  message: string;
  type: NotificationType;
  link: string;
  memberIds?: string[];
};
export type SendNotificationProps = BaseSendNotificationProps &
  (
    | {
        // Send as author (e.g. Jane Smith, Källarmästare)
        fromAuthor: Author;
        fromMemberId?: never;
      }
    | {
        // Send as member (e.g. Jane Smith)
        fromAuthor?: never;
        fromMemberId: string;
      }
    | {
        // Send as system (e.g. D-sek)
        fromAuthor?: never;
        fromMemberId?: never;
      }
  );

// Need permissions to read expo tokens and send notifications without sharing expo tokens to the public
const prisma = authorizedPrismaClient;

/**
 *
 * @param title Title for the notification
 * @param message Body of the message
 * @param type NotificationType
 * @param link used when notification is clicked
 * @param memberIds if no memberId is input then it will send to all users
 * @param fromAuthor (optional)
 * @param fromMemberId (optional), if fromAuthor is not given, use this member id to find/create author
 */
const sendNotification = async ({
  title,
  message,
  type,
  link,
  memberIds,
  fromAuthor,
  fromMemberId,
}: SendNotificationProps) => {
  if ((memberIds?.length ?? 0) == 0) return;
  // Find corresponding setting type, example "COMMENT" for "EVENT_COMMENT"
  const settingType: NotificationSettingType = (Object.entries(
    SUBSCRIPTION_SETTINGS_MAP,
  ).find(([, internalTypes]) => internalTypes.includes(type))?.[0] ??
    type) as NotificationSettingType;
  // Who sent the notification, as an Author
  const existingAuthor =
    fromAuthor ??
    (fromMemberId
      ? await prisma.author.findFirst({
          where: { memberId: fromMemberId, mandateId: null, customId: null },
        })
      : undefined);

  // If member doesn't have author since before, create one
  const notificationAuthor =
    existingAuthor ??
    (fromMemberId
      ? await prisma.author.create({
          data: { memberId: fromMemberId! },
        })
      : undefined);

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
        not:
          process.env["NODE_ENV"] === "development"
            ? undefined
            : notificationAuthor?.memberId,
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
  if (receivingMembers.length < 1) {
    return;
  }
  console.log(
    `Sending ${type} notification to ${receivingMembers.length} members${
      notificationAuthor
        ? `, sent from author:${notificationAuthor.id} [${notificationAuthor.type}, member: ${notificationAuthor.memberId}]`
        : ""
    }`,
  );

  if (title.length > 255) title = title.substring(0, 251) + "...";
  if (message.length > 255) message = message.substring(0, 251) + "...";

  const result = await Promise.allSettled([
    await sendWeb(
      title,
      message,
      type,
      link,
      notificationAuthor,
      receivingMembers,
    ),
    await sendPush(title, message, settingType, link, receivingMembers),
  ]);

  if (result[0].status == "rejected") {
    throw error(500, "Failed to create notifications");
  }

  if (result[1].status == "rejected") {
    throw error(500, "Failed to create push notifications");
  }
};

const sendWeb = async (
  title: string,
  message: string,
  type: NotificationType,
  link: string,
  notificationAuthor: Author | undefined,
  receivingMembers: Array<Pick<Member, "id">>,
) => {
  const databaseResult = await prisma.notification.createMany({
    data: receivingMembers.map(({ id: memberId }) => ({
      title,
      message,
      type,
      link,
      memberId,
      fromAuthorId: notificationAuthor?.id,
    })),
  });
  return databaseResult;
};

const sendPush = async (
  title: string,
  message: string,
  type: NotificationSettingType,
  link: string,
  receivingMembers: Array<
    Pick<Member, "id"> & {
      subscriptionSettings: Array<
        Pick<SubscriptionSetting, "pushNotification">
      >;
    }
  >,
) => {
  // Get user's expo tokens and use them to send push notifications
  const pushNotificationMembers = receivingMembers
    .filter(
      (
        member, // Filter all members who don't have push notification enabled for this type of notifications
      ) =>
        member.subscriptionSettings.some(
          (settings) => settings.pushNotification,
        ),
    )
    .map((member) => member.id); // Return an array of strings with their memberIds
  const expoTokens = await prisma.expoToken.findMany({
    where: {
      memberId: {
        in: pushNotificationMembers,
      },
    },
  });

  if (expoTokens != undefined) {
    sendPushNotifications(
      expoTokens.map((token) => token.expoToken),
      title,
      message,
      type,
      link,
    );
  }
};

export default sendNotification;
