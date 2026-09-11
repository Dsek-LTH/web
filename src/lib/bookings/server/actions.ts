import { fail, type RequestEvent } from "@sveltejs/kit";
import { z } from "zod";
import { superValidate } from "sveltekit-superforms/server";
import { zod4 } from "sveltekit-superforms/adapters";
import { redirect } from "sveltekit-flash-message/server";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import * as m from "$paraglide/messages";
import apiNames from "$lib/utils/apiNames";
import { authorize, isAuthorized } from "$lib/utils/authorization";
import sendNotification from "$lib/utils/notifications";
import { NotificationType } from "$lib/utils/notifications/types";
import {
  clearBookingDoorAccess,
  grantBookingDoorAccess,
} from "$lib/bookings/server/doorAccess";
import type {
  ExtendedPrisma,
  ExtendedPrismaModel,
} from "$lib/server/extendedPrisma";

dayjs.extend(utc);
dayjs.extend(timezone);

type BookingRequestWithBookables = ExtendedPrismaModel<"BookingRequest"> & {
  bookables: Array<ExtendedPrismaModel<"Bookable">>;
};

export async function sendNotificationToKM(
  bookingRequest: BookingRequestWithBookables,
  prisma: ExtendedPrisma,
) {
  const kallarMastare = await prisma.member.findFirst({
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
  if (!kallarMastare) return;

  const booker = bookingRequest.bookerId
    ? await prisma.member.findUnique({
        where: { id: bookingRequest.bookerId },
      })
    : null;
  const bookerName = booker
    ? `${booker.firstName} ${booker.lastName}`
    : "Unknown";

  const bookablesString = bookingRequest.bookables
    .map((bookable) => bookable.nameEn ?? bookable.nameSv)
    .join(", ");

  await sendNotification({
    title: `New booking request: ${bookingRequest.event}`,
    message: `${bookerName} wants to book '${bookablesString}' from ${dayjs(bookingRequest.start).format("DD/MM HH:mm")} until ${dayjs(bookingRequest.end).format("DD/MM HH:mm")}.`,
    type: NotificationType.BOOKING_REQUEST,
    link: `/bookings/admin/${bookingRequest.id}`,
    memberIds: [kallarMastare.id],
  });
}

async function notifyBooker(
  bookerId: string | null,
  eventName: string | null,
  status: "ACCEPTED" | "DENIED",
  fromMemberId: string | undefined,
) {
  if (!bookerId || !fromMemberId) return;

  await sendNotification({
    title: `Booking request ${status.toLowerCase()}`,
    message: `Your booking request for ${eventName} has been ${status.toLowerCase()}`,
    type: NotificationType.BOOKING_REQUEST,
    link: `/bookings`,
    memberIds: [bookerId],
    fromMemberId,
  });
}

const reviewAccessSchema = z.object({
  accessDoors: z.array(z.string()).default([]),
  accessMemberIds: z.array(z.uuid()).default([]),
});

async function updateBookingStatus(
  event: RequestEvent,
  status: "ACCEPTED" | "DENIED",
  // Only the dedicated review page lets the admin edit the requested
  // doors/members before accepting. The calendar and table quick-actions
  // don't submit that data at all, so applying it there would wipe out
  // whatever the booker originally requested.
  { updateAccessRequest = false }: { updateAccessRequest?: boolean } = {},
) {
  const { request, locals } = event;
  const { prisma, user } = locals;

  authorize(apiNames.BOOKINGS.UPDATE, user);

  const formData = await request.formData();
  const id = formData.get("id");
  if (!id || typeof id !== "string") {
    return fail(422, { message: "Invalid booking request id" });
  }

  let accessDoors: string[] | undefined;
  let accessMemberIds: string[] | undefined;
  if (updateAccessRequest) {
    const accessForm = await superValidate(formData, zod4(reviewAccessSchema));
    if (!accessForm.valid) {
      return fail(400, { message: "Invalid access request" });
    }
    ({ accessDoors, accessMemberIds } = accessForm.data);
  }

  const bookingRequest = await prisma.bookingRequest.update({
    where: { id },
    data: {
      status,
      // The admin can edit the requested doors/members up until acceptance
      ...(status === "ACCEPTED" &&
        accessDoors &&
        accessMemberIds && {
          accessDoors: { set: accessDoors.map((name) => ({ name })) },
          accessMembers: { set: accessMemberIds.map((id) => ({ id })) },
        }),
    },
    include: {
      accessDoors: true,
      accessMembers: { select: { studentId: true } },
    },
  });

  if (status === "ACCEPTED") {
    await grantBookingDoorAccess(bookingRequest);
  } else {
    await clearBookingDoorAccess(bookingRequest.id);
  }

  await notifyBooker(
    bookingRequest.bookerId,
    bookingRequest.event,
    status,
    user?.memberId,
  ).catch((e) => {
    console.log("Failed sending booking status notification: ", e);
  });

  return { success: true };
}

export async function deleteBookingRequest(event: RequestEvent) {
  const { request, locals } = event;
  const { prisma, user } = locals;

  const formData = await request.formData();
  const id = formData.get("id");
  if (!id || typeof id !== "string") {
    return fail(422, { message: "Invalid booking request id" });
  }

  const bookingRequest = await prisma.bookingRequest.findUnique({
    where: { id },
  });
  if (!bookingRequest) {
    return fail(404, { message: m.booking_errors_notFound() });
  }

  const isAdmin = isAuthorized(apiNames.BOOKINGS.UPDATE, user);
  const isOwner = !!user?.memberId && bookingRequest.bookerId === user.memberId;
  if (!isAdmin && !isOwner) {
    return fail(403, { message: m.booking_errors_notAuthorized() });
  }

  await prisma.bookingRequest.delete({ where: { id } });

  return { success: true };
}

export const bookingReviewActions = {
  accept: (event: RequestEvent) => updateBookingStatus(event, "ACCEPTED"),
  reject: (event: RequestEvent) => updateBookingStatus(event, "DENIED"),
  delete: deleteBookingRequest,
};

// Used on the dedicated review page (/bookings/admin/[id]), where accepting
// or rejecting should send the admin back to the booking list. The calendar
// and table views use bookingReviewActions instead, since they update the
// booking in place and must stay on the same page.
async function updateBookingStatusAndRedirect(
  event: RequestEvent,
  status: "ACCEPTED" | "DENIED",
) {
  const result = await updateBookingStatus(event, status, {
    updateAccessRequest: true,
  });
  if (!("success" in result && result.success)) {
    return result;
  }

  throw redirect(
    `/bookings/admin`,
    {
      message:
        status === "ACCEPTED" ? m.booking_accepted() : m.booking_denied(),
      type: "success",
    },
    event,
  );
}

export const bookingReviewPageActions = {
  accept: (event: RequestEvent) =>
    updateBookingStatusAndRedirect(event, "ACCEPTED"),
  reject: (event: RequestEvent) =>
    updateBookingStatusAndRedirect(event, "DENIED"),
  delete: deleteBookingRequest,
};
