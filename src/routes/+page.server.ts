import DOMPurify from "isomorphic-dompurify";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  const { prisma } = locals;
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
        body: DOMPurify.sanitize(article.body),
        bodyEn: article.bodyEn
          ? DOMPurify.sanitize(article.bodyEn)
          : article.bodyEn,
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
        description: DOMPurify.sanitize(event.description),
        descriptionEn: event.descriptionEn
          ? DOMPurify.sanitize(event.descriptionEn)
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
  const alert = prisma.alert.findMany({
    where: {
      removedAt: null
    }
  })
  return {
    news: await news,
    events: await events,
    meetings: {
      upcoming: await upcomingMeeting,
      previous: await previousMeeting,
    },
    cafeOpen: await cafeOpen,
    alert: await alert,
  };
};
