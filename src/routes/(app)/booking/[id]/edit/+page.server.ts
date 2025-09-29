import { fail, superValidate } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";
import { bookingSchema } from "../../schema";
import { redirect } from "$lib/utils/redirect";
import * as m from "$paraglide/messages";
import { isAuthorized } from "$lib/utils/authorization";
import apiNames from "$lib/utils/apiNames";
import { getBookingRequestOrThrow, getSuperValidatedForm } from "../../utils";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

export const load = async ({ locals, params }) => {
  const { prisma } = locals;
  const bookables = await prisma.bookable.findMany();

  const bookingRequest = await getBookingRequestOrThrow(prisma, params.id);
  const form = await getSuperValidatedForm(bookingRequest);

  return { bookables, form, booking: bookingRequest };
};

export const actions = {
  default: async (event) => {
    const { request, locals } = event;
    const { prisma, user } = locals;

    const isAdmin = isAuthorized(apiNames.BOOKABLES.UPDATE, user);

    const form = await superValidate(request, zod(bookingSchema));
    if (!form.valid) return fail(400, { form });
    const { start, end, name, bookables, groups } = form.data;

    dayjs.extend(utc);
    dayjs.extend(timezone);

    await prisma.bookingRequest.update({
      where: {
        id: event.params.id,
      },
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
          set: bookables.map((bookable) => ({
            id: bookable,
          })),
        },
        groups: {
          set: groups,
        },
        // Require new approval of booking after edit (if the user is not an admin)
        ...(!isAdmin && { status: "PENDING" }),
      },
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
