import { groupNotifications } from "$lib/utils/notifications/group";
import type { PrismaClient } from "@prisma/client";
import type { AuthUser } from "@zenstackhq/runtime";

/**
 * Gets all notifications for a user
 * @param user The user
 * @param prisma a prisma client with correct authorization for the user
 * @returns a list of notifications
 */
const getMyNotifications = (user: AuthUser, prisma: PrismaClient) => {
  return prisma.notification.findMany({
    where: {
      memberId: user.memberId,
    },
    orderBy: {
      createdAt: "desc", // latest first
    },
    include: {
      fromAuthor: {
        include: {
          member: {
            select: {
              firstName: true,
              nickname: true,
              lastName: true,
              picturePath: true
            }
          },
          mandate: {
            include: {
              position: true,
            },
          },
          customAuthor: true,
        },
      },
    },
  });
};

export const getMyGroupedNotifications = async (
  user: AuthUser,
  prisma: PrismaClient,
) => {
  const myNotifications = await getMyNotifications(user, prisma);
  return groupNotifications(myNotifications);
};
