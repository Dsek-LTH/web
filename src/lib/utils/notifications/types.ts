// These are to be used internally within the website to seperate different types of notifications.
// You can add as many as you like, but make sure to map them to notification settings.
export enum NotificationType {
	NEWS_LIKE = "NEWS_LIKE",
	EVENT_LIKE = "EVENT_LIKE",
	COMMENT = "COMMENT",
	EVENT_COMMENT = "EVENT_COMMENT",
	ARTICLE_REQUEST_UPDATE = "ARTICLE_REQUEST_UPDATE",
	MENTION = "MENTION",
	NEW_ARTICLE = "NEW_ARTICLE",
	EVENT_GOING = "EVENT_GOING",
	EVENT_INTERESTED = "EVENT_INTERESTED",
	CREATE_MANDATE = "CREATE_MANDATE",
	BOOKING_REQUEST = "BOOKING_REQUEST",
	PING = "PING",
	PAYMENT_STATUS = "PAYMENT_STATUS",
	PURCHASE_TIME_TO_BUY = "PURCHASE_TIME_TO_BUY",
	PURCHASE_IN_QUEUE = "PURCHASE_IN_QUEUE",
	PURCHASE_CONSUMABLE_EXPIRED = "PURCHASE_CONSUMABLE_EXPIRED",
	PURCHASE_SOLD_OUT = "PURCHASE_SOLD_OUT",
	EXPENSES = "EXPENSES",
}

// These represent which settings users can turn on and off. The reason why we have fewer of these than NotificationTypes is that user's shouldn't be overwhelmed with too many settings.
// We have a map to mape a NotificationSettingType to a list of NotificationTypes.
// For example, "LIKE" represents all types of likes, but internally we might want to seperate between news and events.
// These are also specified WITHIN THE APP, because on android these channels let both us and users specify notification-specific settings like if they should make a sound or not. Also letting the user disable different types of notifications directly in their OS settings.
// Thus, if you add a new setting type here, you also HAVE TO add it to the app in its respective repo.
export enum NotificationSettingType {
	LIKE = "LIKE",
	COMMENT = "COMMENT",
	MENTION = "MENTION",
	NEW_ARTICLE = "NEW_ARTICLE",
	EVENT_GOING = "EVENT_GOING",
	CREATE_MANDATE = "CREATE_MANDATE",
	BOOKING_REQUEST = "BOOKING_REQUEST",
	PING = "PING",
	PURCHASES = "PURCHASES",
}

/**
 * Defines whether or not a notification type should be "grouped"/"merged" when viewed on the site.
 * For example, 5 NEWS_LIKE notifications can be merged into "John Smith, Jane Doe and 3 others have liked your article"
 * Notifications of the same type will only be merged if they have the same link.
 * When in doubt: "false". If you change to true, there might be code edits necessary in the "groupNotifications" method.
 */
export const SHOULD_MERGE_NOTIFICATIONS: Record<NotificationType, boolean> = {
	[NotificationType.NEWS_LIKE]: true,
	[NotificationType.EVENT_LIKE]: true,
	[NotificationType.COMMENT]: false,
	[NotificationType.EVENT_COMMENT]: false,
	[NotificationType.ARTICLE_REQUEST_UPDATE]: false,
	[NotificationType.MENTION]: true,
	[NotificationType.NEW_ARTICLE]: false,
	[NotificationType.EVENT_GOING]: true,
	[NotificationType.EVENT_INTERESTED]: true,
	[NotificationType.CREATE_MANDATE]: false,
	[NotificationType.BOOKING_REQUEST]: false,
	[NotificationType.PING]: true,
	[NotificationType.PAYMENT_STATUS]: false,
	[NotificationType.PURCHASE_TIME_TO_BUY]: false,
	[NotificationType.PURCHASE_IN_QUEUE]: false,
	[NotificationType.PURCHASE_CONSUMABLE_EXPIRED]: false,
	[NotificationType.PURCHASE_SOLD_OUT]: false,
	[NotificationType.EXPENSES]: false,
};

export const NOTIFICATION_SETTINGS_ALWAYS_ON = "DEFAULT"; // Notifications all users will receive, can't be toggled
/**
 * Maps subscription settings to internal notification types.
 * A subscription setting controls said notification types.
 */
export const SUBSCRIPTION_SETTINGS_MAP: Record<
	NotificationSettingType | typeof NOTIFICATION_SETTINGS_ALWAYS_ON,
	NotificationType[]
> = {
	// On for everyone
	[NOTIFICATION_SETTINGS_ALWAYS_ON]: [NotificationType.EXPENSES],
	[NotificationSettingType.LIKE]: [
		NotificationType.NEWS_LIKE,
		NotificationType.EVENT_LIKE,
	],
	[NotificationSettingType.COMMENT]: [
		NotificationType.COMMENT,
		NotificationType.EVENT_COMMENT,
		// I think using "COMMENT" for ARTICLE_REQUEST_UPDATE makes sense.
		// We don't want to overwhelm user with TOO many notification options, and I feel like
		// the same demographic want notifications for comments and approvements.
		NotificationType.ARTICLE_REQUEST_UPDATE,
	],
	[NotificationSettingType.MENTION]: [NotificationType.MENTION],
	[NotificationSettingType.NEW_ARTICLE]: [NotificationType.NEW_ARTICLE],
	[NotificationSettingType.EVENT_GOING]: [
		NotificationType.EVENT_GOING,
		NotificationType.EVENT_INTERESTED,
	],
	[NotificationSettingType.CREATE_MANDATE]: [NotificationType.CREATE_MANDATE],
	[NotificationSettingType.BOOKING_REQUEST]: [NotificationType.BOOKING_REQUEST],
	[NotificationSettingType.PING]: [NotificationType.PING],
	[NotificationSettingType.PURCHASES]: [
		NotificationType.PAYMENT_STATUS,
		NotificationType.PURCHASE_TIME_TO_BUY,
		NotificationType.PURCHASE_IN_QUEUE,
		NotificationType.PURCHASE_CONSUMABLE_EXPIRED,
		NotificationType.PURCHASE_SOLD_OUT,
	],
};

export const DEFAULT_SUBSCRIPTION_SETTINGS: Array<{
	type: NotificationSettingType;
	pushNotification: boolean;
}> = [
	{
		type: NotificationSettingType.LIKE,
		pushNotification: false,
	},
	{
		type: NotificationSettingType.COMMENT,
		pushNotification: true,
	},
	{
		type: NotificationSettingType.MENTION,
		pushNotification: true,
	},
	{
		type: NotificationSettingType.NEW_ARTICLE,
		pushNotification: true,
	},
	{
		type: NotificationSettingType.CREATE_MANDATE,
		pushNotification: true,
	},
	{
		type: NotificationSettingType.BOOKING_REQUEST,
		pushNotification: true,
	},
	{
		type: NotificationSettingType.PING,
		pushNotification: false,
	},
	{
		type: NotificationSettingType.PURCHASES,
		pushNotification: true,
	},
	// PURCHASES, NEW_ARTICLE ([NOLLNING] tagg), MENTION, kanse PING (icke-push)
];

export const NOLLA_DEFAULT_SUBSCRIPTION_SETTINGS: Array<{
	type: NotificationSettingType;
	pushNotification: boolean;
}> = [
	{
		type: NotificationSettingType.MENTION,
		pushNotification: false,
	},
	{
		type: NotificationSettingType.NEW_ARTICLE,
		pushNotification: true,
	},
	{
		type: NotificationSettingType.PING,
		pushNotification: false,
	},
	{
		type: NotificationSettingType.PURCHASES,
		pushNotification: true,
	},
];
