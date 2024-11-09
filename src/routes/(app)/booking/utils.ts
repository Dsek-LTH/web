import sendNotification from "$lib/utils/notifications";
import { NotificationType } from "$lib/utils/notifications/types";
import { error, type RequestEvent } from "@sveltejs/kit";
import type { Actions } from "./$types";
import dayjs from "dayjs";
import type { Bookable, BookingRequest, PrismaClient } from "@prisma/client";
import { superValidate } from "sveltekit-superforms/server";
import { zod } from "sveltekit-superforms/adapters";
import { bookingSchema } from "./schema";
import * as m from "$paraglide/messages";

export const actions: Actions = {
  accept: async (event: RequestEvent) => {
    await performAction(event, true);
  },
  reject: async (event: RequestEvent) => {
    await performAction(event, false);
  },
};

export async function getUpcomingBookingRequests(prisma: PrismaClient) {
  return prisma.bookingRequest.findMany({
    where: {
      start: {
        gte: dayjs().subtract(1, "week").toDate(),
      },
    },
    orderBy: [{ start: "asc" }, { end: "asc" }, { status: "asc" }],
    include: {
      bookables: true,
      booker: true,
    },
  });
}

export async function getBookingRequestOrThrow(
  prisma: PrismaClient,
  id: string,
) {
  return prisma.bookingRequest
    .findUniqueOrThrow({
      where: { id },
      include: { bookables: true },
    })
    .catch(() => {
      throw error(404, m.booking_errors_notFound());
    });
}

export async function getSuperValidatedForm(
  bookingRequest: BookingRequest & { bookables: Bookable[] },
) {
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
  return await superValidate(initialData, zod(bookingSchema));
}

async function performAction(event: RequestEvent, accepted: boolean) {
  const { request, locals } = event;
  const { prisma, user } = locals;
  const formData = await request.formData();
  const id = formData.get("id");
  const status = accepted ? "ACCEPTED" : "DENIED";

  if (id && typeof id === "string") {
    await prisma.bookingRequest.update({
      where: {
        id,
      },
      data: {
        status,
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
        title: `Booking request ${status.toLowerCase()}`,
        message: `Your booking request for ${request.event} has been ${status.toLowerCase()}`,
        type: NotificationType.BOOKING_REQUEST,
        link: `/booking`,
        memberIds: [request.bookerId],
        fromMemberId: user.memberId,
      });
    }
  }
}
