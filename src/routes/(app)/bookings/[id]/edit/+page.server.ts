import { error, fail } from "@sveltejs/kit";
import { superValidate } from "sveltekit-superforms/server";
import { zod4 } from "sveltekit-superforms/adapters";
import { redirect } from "sveltekit-flash-message/server";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import * as m from "$paraglide/messages";
import apiNames from "$lib/utils/apiNames";
import { isAuthorized } from "$lib/utils/authorization";
import { bookingSchema } from "$lib/bookings/schema";
import {
  getBookingRequestOrThrow,
  getSuperValidatedBookingForm,
  toMemberSearchAttributes,
} from "$lib/bookings/server/queries";
import {
  clearBookingDoorAccess,
  grantBookingDoorAccess,
} from "$lib/bookings/server/doorAccess";
import authorizedPrismaClient from "$lib/server/authorizedPrisma";
import type { Actions, PageServerLoad } from "./$types";

dayjs.extend(utc);
dayjs.extend(timezone);

export const load: PageServerLoad = async ({ locals, params }) => {
  const { prisma, user } = locals;
  const bookables = await prisma.bookable.findMany();
  const doors = await authorizedPrismaClient.door.findMany();

  const booking = await getBookingRequestOrThrow(prisma, params.id);
  const isAdmin = isAuthorized(apiNames.BOOKINGS.UPDATE, user);
  const isOwner = !!user?.memberId && booking.bookerId === user.memberId;
  if (!isAdmin && !isOwner) {
    throw error(403, m.booking_errors_notAuthorized());
  }

  const form = await getSuperValidatedBookingForm(booking);
  const initialAccessMembers = booking.accessMembers.map(
    toMemberSearchAttributes,
  );

  return { bookables, doors, form, booking, isAdmin, initialAccessMembers };
};

export const actions: Actions = {
  default: async (event) => {
    const { request, locals, params } = event;
    const { prisma, user } = locals;

    const booking = await getBookingRequestOrThrow(prisma, params.id);
    const isAdmin = isAuthorized(apiNames.BOOKINGS.UPDATE, user);
    const isOwner = !!user?.memberId && booking.bookerId === user.memberId;
    if (!isAdmin && !isOwner) {
      throw error(403, m.booking_errors_notAuthorized());
    }

    const form = await superValidate(request, zod4(bookingSchema));
    if (!form.valid) return fail(400, { form });
    const { start, end, name, bookables, accessDoors, accessMemberIds } =
      form.data;

    const updatedBooking = await prisma.bookingRequest.update({
      where: { id: params.id },
      data: {
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
          set: bookables.map((bookable) => ({ id: bookable })),
        },
        accessDoors: {
          set: accessDoors.map((doorName) => ({ name: doorName })),
        },
        accessMembers: {
          set: accessMemberIds.map((memberId) => ({ id: memberId })),
        },
        // Require new approval of the booking after edit, unless an admin made the change
        ...(!isAdmin && { status: "PENDING" }),
      },
      include: {
        accessDoors: true,
        accessMembers: { select: { studentId: true } },
      },
    });

    // Access granted for the previous version of the booking is no longer valid.
    if (isAdmin && updatedBooking.status === "ACCEPTED") {
      await grantBookingDoorAccess(updatedBooking);
    } else {
      await clearBookingDoorAccess(updatedBooking.id);
    }

    throw redirect(
      `/bookings`,
      {
        message: m.booking_requestSent(),
        type: "success",
      },
      event,
    );
  },
};
