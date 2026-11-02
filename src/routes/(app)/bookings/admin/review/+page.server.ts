import apiNames from "$lib/utils/apiNames";
import { authorize } from "$lib/utils/authorization";
import { bookingReviewActions } from "$lib/bookings/server/actions";
import { getBookingReviewQueue } from "$lib/bookings/server/queries";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  const { prisma, user } = locals;
  authorize(apiNames.BOOKINGS.UPDATE, user);

  const queue = await getBookingReviewQueue(prisma);

  return { queue };
};

export const actions: Actions = bookingReviewActions;
