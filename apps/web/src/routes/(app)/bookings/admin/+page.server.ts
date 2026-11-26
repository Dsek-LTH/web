import { bookingReviewActions } from "$lib/bookings/server/actions";
import { getUpcomingBookingRequests } from "$lib/bookings/server/queries";
import type { Actions, PageServerLoad } from "./$types";
import { requirePolicy } from "$lib/utils/access";
import apiNames from "$lib/utils/apiNames";

// The admin list's actions (accept/reject) need booking_request:update in Go.
export const load: PageServerLoad = async (event) => {
  requirePolicy(event.locals.user, apiNames.BOOKINGS.UPDATE);
  return { bookingRequests: await getUpcomingBookingRequests(event) };
};

export const actions: Actions = bookingReviewActions;
