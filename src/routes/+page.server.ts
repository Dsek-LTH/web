import DOMPurify from "isomorphic-dompurify";
import type { Actions, PageServerLoad } from "./$types";
import { notificationSchema } from "$lib/zod/schemas";
import { superValidate } from "sveltekit-superforms/server";

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

// These actions will be accessed from throughout the whole application
export const actions: Actions = {
  // Update on database that these notifications have been read by user
  readnotifications: async ({ locals, request }) => {
    const { prisma } = locals;
    const form = await superValidate(request, notificationSchema);
    if (!form.valid) return;
    await prisma.notification.updateMany({
      data: {
        readAt: new Date(),
      },
      where: {
        memberId: form.data.memberId,
      },
    });
  },
  // Delete single or multiple notifications on database
  deletenotification: async ({ locals, request }) => {
    const { prisma } = locals;
    const form = await superValidate(request, notificationSchema);
    if (!form.valid) return;
    // If multiple ids and not a single id have been provided, delete many, otherwise,
    // if a single has been provided, delete single, else return
    if (!form.data.notificationId && form.data.notificationIds) {
      await prisma.notification.deleteMany({
        where: {
          memberId: form.data.memberId,
          id: {
            in: form.data.notificationIds,
          },
        },
      });
    } else if (form.data.notificationId) {
      await prisma.notification.delete({
        where: {
          memberId: form.data.memberId,
          id: form.data.notificationId,
        },
      });
    } else return;
  },
};
