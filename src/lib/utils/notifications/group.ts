import { getAuthorName } from "$lib/utils/client/member";
import {
  NotificationType,
  SHOULD_MERGE_NOTIFICATIONS,
} from "$lib/utils/notifications/types";
import type {
  Notification as Notification,
  Author,
  CustomAuthor,
  Member,
  Position,
} from "@prisma/client";

// A notification as it is returned from prisma query
export type ExpandedNotification = Notification & {
  fromAuthor:
    | (Pick<Author, "id" | "type"> & {
        member: Pick<
          Member,
          "firstName" | "nickname" | "lastName" | "picturePath"
        >;
        mandate: {
          position: Pick<Position, "name">;
        } | null;
        customAuthor: Pick<CustomAuthor, "name" | "imageUrl"> | null;
      })
    | null;
};
// Grouped notifications, as to be shown in the frontend.
export type NotificationGroup = Omit<
  ExpandedNotification,
  "fromAuthor" | "fromAuthorId"
> & {
  authors: Array<ExpandedNotification["fromAuthor"]>;
  individualIds: Array<ExpandedNotification["id"]>;
};

/**
 * Gets the "person identifier" for a notification group.
 * Example: John Smith, Jane Doe and 3 others ...
 * @param group notification group. Expects at least one author, will throw otherwise.
 * @returns a string
 */
function groupAuthorNames(group: NotificationGroup) {
  const authors = group.authors; // unique
  const authorCount = authors.length;
  if (authorCount == 0) return "Någon"; // Edge case, all notification authors are undefined
  const firstAuthor = authors[0];
  if (!firstAuthor) return `${authorCount} personer`; // Edge case, all notification authors are undefined
  const firstAuthorName = getAuthorName(firstAuthor);
  if (authorCount === 1) return getAuthorName(firstAuthor);

  const secondAuthor = authors[1];
  if (!secondAuthor) return `${firstAuthorName} och ${authorCount - 1} andra`;
  const secondAuthorName = getAuthorName(secondAuthor);

  if (authorCount === 2) return `${firstAuthorName} och ${secondAuthorName}`;
  if (authorCount > 3)
    return `${firstAuthorName}, ${secondAuthorName} och ${
      authorCount - 2
    } andra`;

  // exactly 3 authors
  const thirdAuthor = authors[2];
  if (!thirdAuthor)
    return `${firstAuthorName}, ${secondAuthorName} och ${
      authorCount - 2
    } andra`;
  const thirdAuthorName = getAuthorName(secondAuthor);
  return `${firstAuthorName}, ${secondAuthorName} och ${thirdAuthorName}`;
}

type NotificationTexts = Pick<ExpandedNotification, "title" | "message">;
const getGroupTexts = (group: NotificationGroup): NotificationTexts => {
  const type = group.type;
  switch (type) {
    case NotificationType.NEWS_LIKE:
      return {
        title: group.title, // is the article header
        message: `${groupAuthorNames(group)} har gillat din nyhet`,
      };
    case NotificationType.EVENT_LIKE: // THIS IS NOT USED, yet...
      return {
        title: group.title, // is the event title
        message: `${groupAuthorNames(group)} har gillat ditt evenemang`,
      };
    case NotificationType.COMMENT:
      return {
        title: group.title, // is the article header
        message: `${groupAuthorNames(group)} har kommentaret`,
      };
    case NotificationType.EVENT_COMMENT:
      return {
        title: group.title, // is the event title
        message: `${groupAuthorNames(group)} har kommentaret`,
      };
    case NotificationType.MENTION:
      return {
        title: `${groupAuthorNames(group)} har nämnt dig i kommentarer`,
        message: group.message, // is the content of the last comment
      };
    case NotificationType.EVENT_GOING:
      return {
        title: group.title, // title of the event
        message: `${groupAuthorNames(group)} kommer`,
      };
    case NotificationType.EVENT_INTERESTED:
      return {
        title: group.title, // title of the event
        message: `${groupAuthorNames(group)} är intresserade`,
      };
    case NotificationType.PING:
      return {
        title: group.title, // says PING!
        message: `${groupAuthorNames(group)} har pingat dig`,
      };
    default:
      throw new Error(
        `Tried to group notification type which has no group handleer "${type}"`,
      );
  }
};
const convertSingleToGroup = (
  notification: ExpandedNotification,
): NotificationGroup => ({
  ...notification,
  authors: notification.fromAuthor ? [notification.fromAuthor] : [],
  individualIds: [notification.id],
});
const convertToGroup = (
  notifications: ExpandedNotification[],
): NotificationGroup => {
  if (notifications.length === 0) throw new Error("Empty group");
  // fromAuthor and fromAuthorId are not removed, doesn't really matter as they are omitted in the type
  const authors = notifications
    .map((n) => n.fromAuthor)
    .filter(Boolean) as Array<NonNullable<ExpandedNotification["fromAuthor"]>>;
  const uniqueAuthors =
    authors.length > 1
      ? authors.filter(
          (author, index) =>
            authors.findIndex((other) => other.id === author.id) === index,
        )
      : authors;
  return {
    ...notifications[0]!,
    readAt: notifications.some((n) => n.readAt === null)
      ? null
      : notifications[0]!.readAt,
    authors: uniqueAuthors,
    individualIds: notifications.map((n) => n.id),
  };
};
/**
 * Merge a list of notifications into one or more NotificationGroups
 * It will be multiple groups if notifications should not be merged.
 */
const mergeNotifications = (
  notifications: ExpandedNotification[],
  // Returns a list because some notifications can't merge "perfectly" (i.e. into a single notification)
): NotificationGroup | NotificationGroup[] => {
  if (notifications.length === 1)
    return convertSingleToGroup(notifications[0]!);
  const mostRecentNotification = notifications[0]!; // will always be first, because it's ordered from the database
  const type = mostRecentNotification.type;
  if (!(type in SHOULD_MERGE_NOTIFICATIONS))
    throw new Error(`unknown notification type: ${type}`);
  if (!SHOULD_MERGE_NOTIFICATIONS[type as NotificationType])
    return notifications.map(convertSingleToGroup);
  const group = convertToGroup(notifications);
  const texts = getGroupTexts(group);
  group.title = texts.title;
  group.message = texts.message;
  return group;
};

/**
 * Sort groups, latest first
 */
const sortNotificationGroups = (groups: NotificationGroup[]) => {
  groups.sort((a, b) => b.createdAt.valueOf() - a.createdAt.valueOf());
  return groups;
};

/**
 * Convert a list of raw notifications and group them semantically.
 * For example, 5 like notifications on the same article will become "John Smith, Jane Doe and 3 others liked your article"
 */
export const groupNotifications = (
  notifications: ExpandedNotification[],
): NotificationGroup[] => {
  // group all notifications which have the same type and link.
  const groups: Record<string, ExpandedNotification[]> = {};
  for (const notification of notifications) {
    const key = `${notification.type};${notification.link}`; // group by type and link
    if (groups[key] === undefined) {
      groups[key] = [];
    }
    groups[key]?.push(notification);
  }
  // Merge the groups into NotificationGroup objects, some groups might lead to multiple group objects
  const groupList = Object.values(groups).flatMap((group) =>
    mergeNotifications(group),
  );
  // Since we loop over an object, the initial ordering is lost and we have to sort again
  return sortNotificationGroups(groupList);
};
