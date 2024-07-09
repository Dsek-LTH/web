import { groupNotifications } from "$lib/utils/notifications/group";
import type { PrismaClient } from "@prisma/client";
import type { AuthUser } from "@zenstackhq/runtime";
import type { RequestHandler } from "./$types";

/**
 * Get's all notifications for a user
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
          member: true,
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

export const GET: RequestHandler = async ({ locals }) => {
  const { user, prisma } = locals;
  const myNotifications = await getMyNotifications(user, prisma);
  const groupedNotifications = groupNotifications(myNotifications);
  return new Response(JSON.stringify(groupedNotifications));
};
