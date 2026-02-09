import authorizedPrismaClient from "$lib/server/authorizedPrisma";
import type { ExtendedPrismaModel } from "$lib/server/extendedPrisma";
import sendNotification from "$lib/utils/notifications";
import { NotificationType } from "$lib/utils/notifications/types";
import markdownToTxt from "markdown-to-txt";

export const sendNewArticleNotification = async (
  article: ExtendedPrismaModel<"Article"> & {
    tags: Array<Pick<ExtendedPrismaModel<"Tag">, "id">>;
    author: ExtendedPrismaModel<"Author">;
  },
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
