import { bookingReviewActions } from "$lib/bookings/server/actions";
import { getUpcomingBookingRequests } from "$lib/bookings/server/queries";
import type { Actions, PageServerLoad } from "./$types";

// booking_request:read is enforced by Go.
export const load: PageServerLoad = async (event) => ({
  bookingRequests: await getUpcomingBookingRequests(event),
});

export const actions: Actions = bookingReviewActions;
