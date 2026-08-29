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
} from "$lib/bookings/server/queries";
import type { Actions, PageServerLoad } from "./$types";

dayjs.extend(utc);
dayjs.extend(timezone);

export const load: PageServerLoad = async ({ locals, params }) => {
  const { prisma, user } = locals;
  const bookables = await prisma.bookable.findMany();

  const booking = await getBookingRequestOrThrow(prisma, params.id);
  const isAdmin = isAuthorized(apiNames.BOOKINGS.UPDATE, user);
  const isOwner = !!user?.memberId && booking.bookerId === user.memberId;
  if (!isAdmin && !isOwner) {
    throw error(403, m.booking_errors_notAuthorized());
  }

  const form = await getSuperValidatedBookingForm(booking);

  return { bookables, form, booking, isAdmin };
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
    const { start, end, name, bookables } = form.data;

    await prisma.bookingRequest.update({
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
        // Require new approval of the booking after edit, unless an admin made the change
        ...(!isAdmin && { status: "PENDING" }),
      },
    });

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
