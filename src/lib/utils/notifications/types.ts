export enum NotificationType {
  LIKE = "LIKE",
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
}
export enum NotificationSettingType {
  LIKE = "LIKE",
  COMMENT = "COMMENT",
  MENTION = "MENTION",
  NEW_ARTICLE = "NEW_ARTICLE",
  EVENT_GOING = "EVENT_GOING",
  CREATE_MANDATE = "CREATE_MANDATE",
  BOOKING_REQUEST = "BOOKING_REQUEST",
  PING = "PING",
}

export enum NotificationSettingTypeDescription {
  LIKE = "Gillarmarkeringar på dina inlägg",
  COMMENT = "Kommentarer och uppdateringar på dina inlägg",
  MENTION = "När du blir nämnd",
  NEW_ARTICLE = "Nyhetsprenumationer",
  EVENT_GOING = "Interaktioner på ditt event",
  CREATE_MANDATE = "När du får en ny post",
  BOOKING_REQUEST = "Bokningar",
  PING = "Pingar",
}

/**
 * Maps subscription settings to internal notification types.
 * A subscription setting controls said notification types.
 */
export const SUBSCRIPTION_SETTINGS_MAP: Record<
  NotificationSettingType,
  NotificationType[]
> = {
  LIKE: [NotificationType.LIKE, NotificationType.EVENT_LIKE],
  COMMENT: [
    NotificationType.COMMENT,
    NotificationType.EVENT_COMMENT,
    // I think using "COMMENT" for ARTICLE_REQUEST_UPDATE makes sense.
    // We don't want to overwhelm user with TOO many notification options, and I feel like
    // the same demographic want notifications for comments and approvements.
    NotificationType.ARTICLE_REQUEST_UPDATE,
  ],
  MENTION: [NotificationType.MENTION],
  NEW_ARTICLE: [NotificationType.NEW_ARTICLE],
  EVENT_GOING: [
    NotificationType.EVENT_GOING,
    NotificationType.EVENT_INTERESTED,
  ],
  CREATE_MANDATE: [NotificationType.CREATE_MANDATE],
  BOOKING_REQUEST: [NotificationType.BOOKING_REQUEST],
  PING: [NotificationType.PING],
};

export const DEFAULT_SUBSCRIPTION_SETTINGS: Array<{
  type: NotificationSettingType;
  push_notification: boolean;
}> = [
  {
    type: NotificationSettingType.LIKE,
    push_notification: false,
  },
  {
    type: NotificationSettingType.COMMENT,
    push_notification: true,
  },
  {
    type: NotificationSettingType.MENTION,
    push_notification: true,
  },
  {
    type: NotificationSettingType.NEW_ARTICLE,
    push_notification: true,
  },
  {
    type: NotificationSettingType.CREATE_MANDATE,
    push_notification: true,
  },
  {
    type: NotificationSettingType.BOOKING_REQUEST,
    push_notification: true,
  },
  {
    type: NotificationSettingType.PING,
    push_notification: false,
  },
];
