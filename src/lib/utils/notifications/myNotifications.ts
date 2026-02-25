import {
	groupNotifications,
	type ExpandedNotification,
} from "$lib/utils/notifications/group";
import type { AuthUser } from "@zenstackhq/runtime";
import type { ExtendedPrisma } from "$lib/server/extendedPrisma";

/**
 * Gets all notifications for a user
 * @param user The user
 * @param prisma a prisma client with correct authorization for the user
 * @returns a list of notifications
 */
const getMyNotifications = (
	user: AuthUser,
	prisma: ExtendedPrisma,
): Promise<ExpandedNotification[]> => {
	return prisma.notification.findMany({
		where: {
			memberId: user.memberId,
		},
		orderBy: {
			createdAt: "desc", // latest first
		},
		include: {
			fromAuthor: {
				select: {
					id: true,
					type: true,
					member: {
						select: {
							firstName: true,
							nickname: true,
							lastName: true,
							picturePath: true,
						},
					},
					mandate: {
						select: {
							position: {
								select: {
									name: true,
								},
							},
						},
					},
					customAuthor: {
						select: {
							name: true,
							imageUrl: true,
						},
					},
				},
			},
		},
	});
};

export const getMyGroupedNotifications = async (
	user: AuthUser,
	prisma: ExtendedPrisma,
) => {
	const myNotifications = await getMyNotifications(user, prisma);
	return groupNotifications(myNotifications);
};
