import authorizedPrismaClient from "$lib/server/shop/authorizedPrisma";
import apiNames from "$lib/utils/apiNames";
import { authorize } from "$lib/utils/authorization";
import sendNotification from "$lib/utils/notifications";
import { NotificationType } from "$lib/utils/notifications/types";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  const { prisma, user } = locals;
  authorize(apiNames.BOOKINGS.UPDATE, user);

  const bookingRequests = await authorizedPrismaClient.bookingRequest.findMany({
    where: {
      start: {
        gte: new Date(),
      },
    },
    orderBy: [{ start: "asc" }, { end: "asc" }, { status: "asc" }],
    include: {
      bookables: true,
      booker: true,
    },
  });
  return { bookingRequests };
};

export const actions: Actions = {
  accept: async (event) => {
    const { request, locals } = event;
    const { prisma, user } = locals;
    const formData = await request.formData();
    const id = formData.get("id");
    if (id && typeof id === "string") {
      await prisma.bookingRequest.update({
        where: { id },
        data: {
          status: "ACCEPTED",
        },
      });
      const event = await prisma.bookingRequest.findFirst({
        where: {
          id,
        },
        select: {
          bookerId: true,
          event: true,
        },
      });
      if (event && event.bookerId != null && user && user.memberId) {
        sendNotification({
          title: "Booking request accepted",
          message: `Your booking request for ${event.event} has been accepted`,
          type: NotificationType.BOOKING_REQUEST,
          link: "https://dsek.se/",
          memberIds: [event.bookerId],
          fromMemberId: user.memberId,
        });
      }
    }
  },
  reject: async (event) => {
    const { request, locals } = event;
    const { prisma, user } = locals;
    const formData = await request.formData();
    const id = formData.get("id");
    if (id && typeof id === "string") {
      await prisma.bookingRequest.update({
        where: { id },
        data: {
          status: "DENIED",
        },
      });
      const event = await prisma.bookingRequest.findFirst({
        where: {
          id,
        },
        select: {
          bookerId: true,
          event: true,
        },
      });
      if (event && event.bookerId != null && user && user.memberId) {
        sendNotification({
          title: "Booking request denied",
          message: `Your booking request for ${event.event} has been denied`,
          type: NotificationType.BOOKING_REQUEST,
          link: "https://dsek.se/",
          memberIds: [event.bookerId],
          fromMemberId: user.memberId,
        });
      }
    }
  },
};
