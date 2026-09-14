import type { ExtendedPrismaModel } from "$lib/server/extendedPrisma";
import { getAuthorName } from "$lib/utils/client/member";
import {
  NotificationType,
  SHOULD_MERGE_NOTIFICATIONS,
} from "$lib/utils/notifications/types";
import * as messages from "$paraglide/messages";

// A notification as it is returned from prisma query
export type ExpandedNotification = ExtendedPrismaModel<"Notification"> & {
  fromAuthor:
    | (Pick<ExtendedPrismaModel<"Author">, "id" | "type"> & {
        member: Pick<
          ExtendedPrismaModel<"Member">,
          "firstName" | "nickname" | "lastName" | "picturePath"
        >;
        mandate: {
          position: Pick<ExtendedPrismaModel<"Position">, "name">;
        } | null;
        customAuthor: Pick<
          ExtendedPrismaModel<"CustomAuthor">,
          "name" | "imageUrl"
        > | null;
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
  if (authorCount == 0) return messages.notifications_someone(); // Edge case, all notification authors are undefined
  const firstAuthor = authors[0];
  if (!firstAuthor)
    return messages.notifications_n_people({ count: authorCount }); // Edge case, all notification authors are undefined
  const firstAuthorName = getAuthorName(firstAuthor);
  if (authorCount === 1) return getAuthorName(firstAuthor);

  const secondAuthor = authors[1];
  if (!secondAuthor)
    return messages.notifications_first_and_n_others({
      name: firstAuthorName,
      others: authorCount - 1,
    });
  const secondAuthorName = getAuthorName(secondAuthor);
  if (authorCount === 2)
    return messages.notifications_first_and_second({
      first: firstAuthorName,
      second: secondAuthorName,
    });
  if (authorCount > 3)
    return messages.notifications_first_second_and_n_others({
      first: firstAuthorName,
      second: secondAuthorName,
      others: authorCount - 2,
    });

  // exactly 3 authors
  const thirdAuthor = authors[2];
  if (!thirdAuthor)
    return messages.notifications_first_second_and_n_others({
      first: firstAuthorName,
      second: secondAuthorName,
      others: authorCount - 2,
    });
  const thirdAuthorName = getAuthorName(secondAuthor);
  return messages.notifications_first_second_and_third({
    first: firstAuthorName,
    second: secondAuthorName,
    third: thirdAuthorName,
  });
}

type NotificationTexts = Pick<ExpandedNotification, "title" | "message">;
const getGroupTexts = (group: NotificationGroup): NotificationTexts => {
  const type = group.type;
  const people = groupAuthorNames(group);

  switch (group.type) {
    case NotificationType.NEWS_LIKE:
      return {
        title: group.title, // is the article header
        message: messages.notifications_people_have_liked_your_news_item({
          people,
        }),
      };
    case NotificationType.EVENT_LIKE: // THIS IS NOT USED, yet...
      return {
        title: group.title, // is the event title
        message: messages.notifications_people_have_liked_your_event({
          people,
        }),
      };
    case NotificationType.COMMENT:
      return {
        title: group.title, // is the article header
        message: messages.notifications_people_have_commented({ people }),
      };
    case NotificationType.EVENT_COMMENT:
      return {
        title: group.title, // is the event title
        message: messages.notifications_people_have_commented({ people }),
      };
    case NotificationType.MENTION:
      return {
        title: messages.notifications_people_have_mentioned_you_in_comments({
          people,
        }),
        message: group.message, // is the content of the last comment
      };
    case NotificationType.EVENT_GOING:
      return {
        title: group.title, // title of the event
        message: messages.notifications_people_are_coming({ people }),
      };
    case NotificationType.EVENT_INTERESTED:
      return {
        title: group.title, // title of the event
        message: messages.notifications_people_are_interested({ people }),
      };
    case NotificationType.PING:
      return {
        title: group.title, // says PING!
        message: messages.notifications_people_have_pinged_you({ people }),
      };
    default:
      throw new Error(messages.notifications_no_group_handler({ type }));
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
