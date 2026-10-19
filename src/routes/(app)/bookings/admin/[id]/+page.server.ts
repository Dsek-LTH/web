import apiNames from "$lib/utils/apiNames";
import { authorize } from "$lib/utils/authorization";
import { bookingReviewPageActions } from "$lib/bookings/server/actions";
import {
  getBookingRequestOrThrow,
  getSuperValidatedBookingForm,
  toMemberSearchAttributes,
} from "$lib/bookings/server/queries";
import authorizedPrismaClient from "$lib/server/authorizedPrisma";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals, params }) => {
  const { prisma, user } = locals;
  authorize(apiNames.BOOKINGS.UPDATE, user);

  const bookables = await prisma.bookable.findMany();
  const doors = await authorizedPrismaClient.door.findMany();
  const booking = await getBookingRequestOrThrow(prisma, params.id);
  const form = await getSuperValidatedBookingForm(booking);
  const initialAccessMembers = booking.accessMembers.map(
    toMemberSearchAttributes,
  );

  return { bookables, doors, form, booking, initialAccessMembers };
};

export const actions: Actions = bookingReviewPageActions;
