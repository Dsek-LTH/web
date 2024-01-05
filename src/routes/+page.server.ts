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
      take: 5,
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
  const upcomingMeeting = prisma.meeting.findFirst({
    where: {
      date: {
        gt: new Date(),
      },
    },
    orderBy: {
      date: "asc",
    },
  });
  const previousMeeting = prisma.meeting.findFirst({
    where: {
      date: {
        lt: new Date(),
      },
    },
    orderBy: {
      date: "desc",
    },
  });
  const cafeOpen = prisma.markdown.findFirst({
    where: {
      name: `cafe:open:${new Date().getDay() - 1}`, // we assign monday to 0, not sunday
    },
  });
  return {
    news: await news,
    events: await events,
    meetings: {
      upcoming: await upcomingMeeting,
      previous: await previousMeeting,
    },
    cafeOpen: await cafeOpen,
  };
};
