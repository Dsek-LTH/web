import prisma from "$lib/utils/prisma";
import isomorphicDompurify from "isomorphic-dompurify";
import type { PageServerLoad } from "./$types";
const { sanitize } = isomorphicDompurify;

export const load: PageServerLoad = async () => {
  const news = prisma.article
    .findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 3,
    })
    .then((articles) =>
      articles.map((article) => ({
        ...article,
        body: sanitize(article.body),
        bodyEn: article.bodyEn ? sanitize(article.bodyEn) : article.bodyEn,
      })),
    );
  const events = prisma.event
    .findMany({
      where: {
        startDatetime: {
          gt: new Date(),
        },
      },
      orderBy: {
        startDatetime: "asc",
      },
      take: 3,
    })
    .then((events) =>
      events.map((event) => ({
        ...event,
        description: sanitize(event.description),
        descriptionEn: event.descriptionEn
          ? sanitize(event.descriptionEn)
          : event.descriptionEn,
      })),
    );
  return {
    news: await news,
    events: await events,
  };
};
