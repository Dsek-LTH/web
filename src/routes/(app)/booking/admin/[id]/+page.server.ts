import * as m from "$paraglide/messages";
import { error } from "@sveltejs/kit";
import dayjs from "dayjs";
import { superValidate } from "sveltekit-superforms/server";
import { zod } from "sveltekit-superforms/adapters";
import { bookingSchema } from "../../schema";
import { authorize } from "$lib/utils/authorization";
import apiNames from "$lib/utils/apiNames";
import type { Actions } from "./$types";
import sendNotification from "$lib/utils/notifications";
import { NotificationType } from "$lib/utils/notifications/types";

export const load = async ({ locals, params }) => {
  const { prisma, user } = locals;
  authorize(apiNames.BOOKINGS.UPDATE, user);
  const bookables = await prisma.bookable.findMany();

  const allBookingRequests = await prisma.bookingRequest.findMany({
    include: {
      bookables: true,
    },
  });

  const allBookingRequestsWeekly = await prisma.bookingRequest.findMany({
    where: {
      end: {
        gte: dayjs().subtract(1, "week").toDate(),
      },
    },
    orderBy: [{ start: "asc" }, { end: "asc" }, { status: "asc" }],
    include: {
      bookables: true,
      booker: true,
    },
  });

  const bookingRequest = await prisma.bookingRequest.findUnique({
    where: {
      id: params.id,
    },
    include: {
      bookables: true,
    },
  });

  if (!bookingRequest) {
    throw error(404, m.booking_errors_notFound());
  }

  const initialData = {
    name: bookingRequest.event ?? undefined,
    start: bookingRequest.start
      ? dayjs(bookingRequest.start).format("YYYY-MM-DDTHH:mm")
      : undefined,
    end: bookingRequest.end
      ? dayjs(bookingRequest.end).format("YYYY-MM-DDTHH:mm")
      : undefined,
    bookables: bookingRequest.bookables?.map((bookable) => bookable.id),
  };
  const form = await superValidate(initialData, zod(bookingSchema));

  return {
    bookables,
    form,
    booking: bookingRequest,
    allBookingRequests,
    bookingRequests: allBookingRequestsWeekly,
  };
};

export const actions: Actions = {
  accept: async (event) => {
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
  reject: async (event) => {
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
