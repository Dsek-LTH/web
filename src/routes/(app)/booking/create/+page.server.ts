import { fail } from "@sveltejs/kit";
import { superValidate } from "sveltekit-superforms/server";
import { zod } from "sveltekit-superforms/adapters";
import { redirect } from "$lib/utils/redirect";
import * as m from "$paraglide/messages";
import { bookingSchema } from "../schema";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import {
  type Bookable,
  type BookingRequest,
} from "@prisma/client";
import sendNotification from "$lib/utils/notifications";
import { NotificationType } from "$lib/utils/notifications/types";
import type { ExtendedPrisma } from "$lib/server/extendedPrisma";

export const load = async ({ locals }) => {
  const { prisma } = locals;
  const bookables = await prisma.bookable.findMany();
  const bookingRequests = await prisma.bookingRequest.findMany({
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
  const form = await superValidate(zod(bookingSchema));

  return { bookables, bookingRequests, form };
};

const sendNotificationToKM = async (
  bookingRequest: BookingRequest & { bookables: Bookable[] },
  prisma: ExtendedPrisma,
) => {
  const kallarMastare = await prisma.member.findFirstOrThrow({
    where: {
      mandates: {
        some: {
          positionId: "dsek.km.mastare",
          startDate: { lte: new Date() },
          endDate: { gte: new Date() },
        },
      },
    },
  });

  const booker = (await prisma.member.findUnique({
    where: {
      id: bookingRequest.bookerId ?? undefined,
    },
  })) ?? { firstName: "Unknown", lastName: "" };

  const bookablesString = bookingRequest.bookables
    .map((bookable) => bookable.nameEn)
    .join(", ");

  await sendNotification({
    title: `New booking request: ${bookingRequest.event}`,
    message: `${booker.firstName} ${booker.lastName} wants to book '${bookablesString}' from ${dayjs(bookingRequest.start).format("DD/MM HH:mm")} until ${dayjs(bookingRequest.end).format("DD/MM HH:mm")}.`,
    type: NotificationType.BOOKING_REQUEST,
    link: `/booking/admin/${bookingRequest.id}`,
    memberIds: [kallarMastare.id],
  });
};

export const actions = {
  default: async (event) => {
    const { request, locals } = event;
    const { prisma, user } = locals;

    dayjs.extend(utc);
    dayjs.extend(timezone);

    const form = await superValidate(request, zod(bookingSchema));
    if (!form.valid) return fail(400, { form });
    const { start, end, name, bookables } = form.data;

    const createdRequest = await prisma.bookingRequest.create({
      data: {
        bookerId: user?.memberId,
        start: dayjs
          .tz(start, "Europe/Stockholm")
          .tz("Etc/UTC")
          .format("YYYY-MM-DDTHH:mm:ssZ"),
        end: dayjs
          .tz(end, "Europe/Stockholm")
          .tz("Etc/UTC")
          .format("YYYY-MM-DDTHH:mm:ssZ"),
        event: name,
        bookables: {
          connect: bookables.map((bookable) => ({
            id: bookable,
          })),
        },
        status: "PENDING",
      },
      include: { bookables: true },
    });

    await sendNotificationToKM(createdRequest, prisma).catch((e) => {
      console.log("Failed sending notifications to KM: ", e);
    });

    throw redirect(
      `/booking`,
      {
        message: m.booking_requestSent(),
        type: "success",
      },
      event,
    );
  },
};
