import { fail, superValidate } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";
import { bookingSchema } from "../../schema";
import { redirect } from "$lib/utils/redirect";
import * as m from "$paraglide/messages";
import { isAuthorized } from "$lib/utils/authorization";
import apiNames from "$lib/utils/apiNames";
import { getBookingRequestOrThrow, getSuperValidatedForm } from "../../utils";

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
    const { start, end, name, bookables } = form.data;

    await prisma.bookingRequest.update({
      where: {
        id: event.params.id,
      },
      data: {
        start: new Date(start),
        end: new Date(end),
        event: name,
        bookables: {
          set: bookables.map((bookable) => ({
            id: bookable,
          })),
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
