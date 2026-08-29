import apiNames from "$lib/utils/apiNames";
import { authorize } from "$lib/utils/authorization";
import { bookingReviewActions } from "$lib/bookings/server/actions";
import {
  getBookingRequestOrThrow,
  getSuperValidatedBookingForm,
} from "$lib/bookings/server/queries";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals, params }) => {
  const { prisma, user } = locals;
  authorize(apiNames.BOOKINGS.UPDATE, user);

  const bookables = await prisma.bookable.findMany();
  const booking = await getBookingRequestOrThrow(prisma, params.id);
  const form = await getSuperValidatedBookingForm(booking);

  return { bookables, form, booking };
};

export const actions: Actions = bookingReviewActions;
