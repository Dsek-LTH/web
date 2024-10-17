import sendNotification from "$lib/utils/notifications";
import { NotificationType } from "$lib/utils/notifications/types";
import type { RequestEvent } from "@sveltejs/kit";
import type { Actions } from "./$types";

export const actions: Actions = {
  accept: async (event: RequestEvent) => {
    const { request, locals } = event;
    const { prisma, user } = locals;
    const formData = await request.formData();
    const id = formData.get("id");

    if (id && typeof id === "string") {
      await prisma.bookingRequest.update({
        where: {
          id,
        },
        data: {
          status: "ACCEPTED",
        },
      });

      const request = await prisma.bookingRequest.findFirst({
        where: {
          id,
        },
        select: {
          bookerId: true,
          event: true,
        },
      });

      if (request && request.bookerId != null && user && user.memberId) {
        sendNotification({
          title: "Booking request accepted",
          message: `Your booking request for ${request.event} has been accepted`,
          type: NotificationType.BOOKING_REQUEST,
          link: `/booking`,
          memberIds: [request.bookerId],
          fromMemberId: user.memberId,
        });
      }
    }
  },
  reject: async (event: RequestEvent) => {
    const { request, locals } = event;
    const { prisma, user } = locals;
    const formData = await request.formData();
    const id = formData.get("id");

    if (id && typeof id === "string") {
      await prisma.bookingRequest.update({
        where: {
          id,
        },
        data: {
          status: "DENIED",
        },
      });

      const request = await prisma.bookingRequest.findFirst({
        where: {
          id,
        },
        select: {
          bookerId: true,
          event: true,
        },
      });

      if (request && request.bookerId != null && user && user.memberId) {
        sendNotification({
          title: "Booking request denied",
          message: `Your booking request for ${request.event} has been denied`,
          type: NotificationType.BOOKING_REQUEST,
          link: `/booking`,
          memberIds: [request.bookerId],
          fromMemberId: user.memberId,
        });
      }
    }
  },
};
