import authorizedPrismaClient from "$lib/server/authorizedPrisma";
import type { ExtendedPrismaModel } from "$lib/server/extendedPrisma";
import sendNotification from "$lib/utils/notifications";
import { NotificationType } from "$lib/utils/notifications/types";
import { markdownToTxt } from "markdown-to-txt";
import { sendNewArticleWebhook } from "./webhooks";

type PublishedArticle = ExtendedPrismaModel<"Article"> & {
  tags: Array<Pick<ExtendedPrismaModel<"Tag">, "id">>;
  author: ExtendedPrismaModel<"Author">;
};

export const sendNewArticleNotification = async (
  article: PublishedArticle,
  notificationText: string | null | undefined,
) => {
  const subscribedMembers = await authorizedPrismaClient.member.findMany({
    where: {
      subscribedTags: {
        some: {
          id: {
            in: article.tags.map(({ id }) => id),
          },
        },
      },
    },
    select: {
      id: true,
    },
  });

  await sendNotification({
    title: article.header,
    message: notificationText
      ? notificationText
      : markdownToTxt(article.body).slice(0, 254),
    type: NotificationType.NEW_ARTICLE,
    link: `/news/${article.slug}`,
    fromAuthor: article.author,
    memberIds: subscribedMembers.map(({ id }) => id),
  });
};

/**
 * Announces a newly published article in-app, by push and on Discord. One channel
 * failing doesn't stop the others.
 * @returns whether everything was sent; failures are logged, never thrown
 */
export const announceArticle = async (
  article: PublishedArticle,
  notificationText: string | null | undefined,
): Promise<boolean> => {
  const results = await Promise.allSettled([
    sendNewArticleNotification(article, notificationText),
    sendNewArticleWebhook(article, notificationText),
  ]);
  const failures = results.filter((result) => result.status === "rejected");
  for (const failure of failures) {
    console.error(
      `Failed to announce article ${article.slug}:`,
      failure.reason,
    );
  }
  return failures.length === 0;
};
