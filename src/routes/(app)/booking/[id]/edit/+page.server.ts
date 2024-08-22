import { fail, superValidate } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";
import { bookingSchema } from "../../schema";
import { redirect } from "$lib/utils/redirect";
import * as m from "$paraglide/messages";
import { isAuthorized } from "$lib/utils/authorization";
import apiNames from "$lib/utils/apiNames";
import { error } from "@sveltejs/kit";
import dayjs from "dayjs";

export const load = async ({ locals, params }) => {
  const { prisma } = locals;
  const bookables = await prisma.bookable.findMany();

  const bookingRequest = await prisma.bookingRequest.findUnique({
    where: { id: params.id },
    include: { bookables: true },
  });

  if (!bookingRequest) {
    throw error(404, m.booking_errors_notFound());
  }

  const initialData = {
    name: bookingRequest.event ?? undefined,
    start: bookingRequest.start
      ? dayjs(bookingRequest.start).format("YYYY-MM-DDTHH:MM")
      : undefined,
    end: bookingRequest.end
      ? dayjs(bookingRequest.end).format("YYYY-MM-DDTHH:MM")
      : undefined,
    bookables: bookingRequest.bookables?.map((bookable) => bookable.id),
  };
  const form = await superValidate(initialData, zod(bookingSchema));

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
