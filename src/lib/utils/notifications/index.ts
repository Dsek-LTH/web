// import sendPushNotifications from "$lib/utils/notifications/push";
import {
  NotificationSettingType,
  NotificationType,
  SUBSCRIPTION_SETTINGS_MAP,
} from "$lib/utils/notifications/types";
import type { Author, Prisma, PrismaClient } from "@prisma/client";
import { error } from "@sveltejs/kit";

const DUPLICATE_ALLOWED_TYPES = [
  NotificationType.CREATE_MANDATE,
  NotificationType.ARTICLE_REQUEST_UPDATE,
  NotificationType.BOOKING_REQUEST,
];

type BaseSendNotificationProps = {
  title: string;
  message: string;
  type: NotificationType;
  link: string;
  memberIds?: string[];
};
type SendNotificationProps = BaseSendNotificationProps &
  (
    | {
        fromAuthor: Author;
        fromMemberId?: undefined;
      }
    | {
        fromAuthor?: undefined;
        fromMemberId: string;
      }
  );

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
  // If the author is not given, then find or create the author from the member id
  const notificationAuthor =
    fromAuthor ??
    (await prisma.author.upsert({
      where: {
        memberId: fromMemberId,
        mandateId: null,
        customId: null,
        // The following can not be done because prisma does not support uniqueness on nullable fields
        // SEE: https://github.com/prisma/prisma/issues/3387#issuecomment-1379686316
        // memberId_mandateId_customId: {
        //   memberId: fromMemberId,
        //   mandateId: null,
        //   customId: null,
        // },
      } as Prisma.AuthorWhereUniqueInput, // Because we can't do the above, we have to
      update: {},
      create: {
        memberId: fromMemberId,
      },
    }));

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
        // Uncomment the line below to test
        // not: notificationAuthor?.memberId,
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

  const [databaseResult] = await Promise.allSettled([
    prisma.notification.createMany({
      data: receivingMembers.map(({ id: memberId }) => ({
        title,
        message,
        type,
        link,
        memberId,
        fromAuthorId: notificationAuthor?.id,
      })),
    }),
  ]);
  if (databaseResult.status === "rejected") {
    throw error(
      500,
      `Failed to create notifications. Error: ${databaseResult.reason}`,
    );
  }
  // if (pushResult.status === "rejected") {
  //   throw error(500, "Failed to send push notifications");
  // }
};

// const getPushTokens = async (
//   prisma: PrismaClient,
//   receivingMembers: {
//     id: string;
//     subscriptionSettings: {
//       pushNotification: boolean;
//     }[];
//   }[],
// ) => {
//   const pushNotificationMembers = receivingMembers.filter((s) =>
//     s.subscriptionSettings.some((ss) => ss.pushNotification),
//   );
//   const pushTokens = await prisma.expoToken.findMany({
//     where: {
//       memberId: {
//         in: pushNotificationMembers.map((m) => m.id),
//       },
//     },
//     select: {
//       expoToken: true,
//     },
//   });
//   return pushTokens;
// };

export default sendNotification;
