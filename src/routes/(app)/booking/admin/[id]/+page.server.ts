import * as m from "$paraglide/messages";
import { error } from "@sveltejs/kit";
import dayjs from "dayjs";
import { superValidate } from "sveltekit-superforms/server";
import { zod } from "sveltekit-superforms/adapters";
import { bookingSchema } from "../../schema";
import { authorize } from "$lib/utils/authorization";
import apiNames from "$lib/utils/apiNames";
import { actions, getAllBookingRequestsWeekly } from "../sharedUtils";

export const load = async ({ locals, params }) => {
  const { prisma, user } = locals;
  authorize(apiNames.BOOKINGS.UPDATE, user);
  const bookables = await prisma.bookable.findMany();

  const allBookingRequests = await prisma.bookingRequest.findMany({
    include: {
      bookables: true,
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
    bookingRequests: await getAllBookingRequestsWeekly(prisma),
  };
};

export { actions };
