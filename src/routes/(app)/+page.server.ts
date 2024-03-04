import DOMPurify from "isomorphic-dompurify";
import type { Actions, PageServerLoad } from "./$types";
import { notificationSchema } from "$lib/zod/schemas";
import { message, superValidate } from "sveltekit-superforms/server";
import { authorize } from "$lib/utils/authorization";
import apiNames from "$lib/utils/apiNames";
import { fail } from "@sveltejs/kit";

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
      removedAt: null,
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
    alert: await alert,
  };
};

// These actions will be accessed from throughout the whole application
export const actions: Actions = {
  // Delete single or multiple notifications on database
  deleteNotification: async ({ locals, request }) => {
    const { user, prisma } = locals;
    authorize(apiNames.LOGGED_IN, user);
    const form = await superValidate(request, notificationSchema);
    if (!form.valid) return fail(400, { form });
    // If multiple ids and not a single id have been provided, delete many, otherwise,
    // if a single has been provided, delete single, else return
    if (form.data.notificationIds && form.data.notificationIds.length > 0) {
      await prisma.notification.deleteMany({
        where: {
          memberId: user!.memberId,
          id: {
            in: form.data.notificationIds,
          },
        },
      });
      return message(form, {
        message: "Notiser borttagna",
        type: "hidden",
      });
    } else if (form.data.notificationId) {
      await prisma.notification.delete({
        where: {
          memberId: user!.memberId,
          id: form.data.notificationId,
        },
      });
      return message(form, {
        message: "Notis borttagen",
        type: "hidden",
      });
    }
    return message(
      form,
      { message: "Kunde inte ta bort notes", type: "error" },
      { status: 500 },
    );
  },
};
