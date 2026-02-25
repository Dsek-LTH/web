import { groupNotifications } from "$lib/utils/notifications/group";
import {
	NotificationSettingType,
	NotificationType,
	SUBSCRIPTION_SETTINGS_MAP,
} from "$lib/utils/notifications/types";
import type { AuthUser } from "@zenstackhq/runtime";
import { POST_REVEAL_PREFIX } from "$lib/components/postReveal/types";
import type { ExtendedPrisma } from "$lib/server/extendedPrisma";

/**
 * Gets all notifications for a user
 * @param user The user
 * @param prisma a prisma client with correct authorization for the user
 * @returns a list of notifications
 */
const getNollaNotifications = (user: AuthUser, prisma: ExtendedPrisma) => {
	return prisma.notification.findMany({
		where: {
			createdAt: {
				gt: new Date("2025-06-26T00:00:00"),
			},
			memberId: user.memberId,
			OR: [
				{
					type: {
						in: SUBSCRIPTION_SETTINGS_MAP[NotificationSettingType.PURCHASES],
					},
				},
				{
					type: NotificationType.NEW_ARTICLE,
				},
				{
					link: {
						startsWith: POST_REVEAL_PREFIX,
					},
				},
			],
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

export const getNollaGroupedNotifications = async (
	user: AuthUser,
	prisma: ExtendedPrisma,
) => {
	const myNotifications = await getNollaNotifications(user, prisma);
	return groupNotifications(myNotifications);
};
