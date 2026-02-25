import authorizedPrismaClient from "$lib/server/authorizedPrisma";
import type { ExtendedPrismaModel } from "$lib/server/extendedPrisma";
import sendPushNotifications from "$lib/utils/notifications/push";
import {
	NOTIFICATION_SETTINGS_ALWAYS_ON,
	NotificationSettingType,
	NotificationType,
	SUBSCRIPTION_SETTINGS_MAP,
} from "$lib/utils/notifications/types";
import { error } from "@sveltejs/kit";

const DUPLICATE_ALLOWED_TYPES = [
	NotificationType.CREATE_MANDATE,
	NotificationType.ARTICLE_REQUEST_UPDATE,
	NotificationType.BOOKING_REQUEST,
	NotificationType.PAYMENT_STATUS,
	NotificationType.PURCHASE_TIME_TO_BUY,
	NotificationType.PURCHASE_SOLD_OUT,
	NotificationType.PURCHASE_IN_QUEUE,
	NotificationType.PURCHASE_CONSUMABLE_EXPIRED,
	NotificationType.PAYMENT_STATUS,
	NotificationType.EXPENSES,
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
				fromAuthor: ExtendedPrismaModel<"Author">;
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
	const settingType = Object.entries(SUBSCRIPTION_SETTINGS_MAP).find(
		([, internalTypes]) => internalTypes.includes(type),
	)?.[0] as
		| NotificationSettingType
		| typeof NOTIFICATION_SETTINGS_ALWAYS_ON
		| undefined;
	if (!settingType) throw new Error(`Unknown notification type: ${type}`);

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
			subscriptionSettings:
				settingType == NOTIFICATION_SETTINGS_ALWAYS_ON
					? undefined
					: {
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
					type: settingType,
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
		`Sending ${type} notification to ${receivingMembers.length === 1 ? `member ${receivingMembers[0]?.id}` : `${receivingMembers.length} members`} ${
			notificationAuthor
				? `, sent from author:${notificationAuthor.id} [${notificationAuthor.type}, member: ${notificationAuthor.memberId}]`
				: ""
		}`,
	);

	if (title.length > 255) title = title.substring(0, 251) + "...";
	if (message.length > 255) message = message.substring(0, 251) + "...";

	try {
		await sendWeb(
			title,
			message,
			type,
			link,
			notificationAuthor,
			receivingMembers,
		);
	} catch (e) {
		console.warn("Failed to create web notifications", e);
		throw error(500, "Failed to create notifications");
	}

	try {
		await sendPush(title, message, link, receivingMembers);
	} catch (e) {
		console.warn("Failed to create push notifications", e);
		throw error(500, "Failed to create push notifications");
	}
};

const sendWeb = async (
	title: string,
	message: string,
	type: NotificationType,
	link: string,
	notificationAuthor: ExtendedPrismaModel<"Author"> | undefined,
	receivingMembers: Array<Pick<ExtendedPrismaModel<"Member">, "id">>,
) => {
	return prisma.notification.createMany({
		data: receivingMembers.map(({ id: memberId }) => ({
			title,
			message,
			type,
			link,
			memberId,
			fromAuthorId: notificationAuthor?.id,
		})),
	});
};

const sendPush = async (
	title: string,
	message: string,
	link: string,
	receivingMembers: Array<
		Pick<ExtendedPrismaModel<"Member">, "id"> & {
			subscriptionSettings: Array<
				Pick<ExtendedPrismaModel<"SubscriptionSetting">, "pushNotification">
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

	const tokensAndUnreadNotificationCount = await prisma.expoToken.findMany({
		where: {
			memberId: {
				in: pushNotificationMembers,
			},
		},
		select: {
			expoToken: true,
			member: {
				select: {
					_count: {
						select: {
							notifications: {
								where: {
									readAt: null,
								},
							},
						},
					},
				},
			},
		},
	});

	if (tokensAndUnreadNotificationCount.length > 0) {
		sendPushNotifications(
			tokensAndUnreadNotificationCount.map((token) => ({
				token: token.expoToken,
				unreadNotifications: token.member?._count.notifications,
			})),
			title,
			message,
			link,
		);
	}
};

export default sendNotification;
