import { bookingReviewActions } from "$lib/bookings/server/actions";
import { getUpcomingBookingRequests } from "$lib/bookings/server/queries";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async (event) => ({
  bookings: await getUpcomingBookingRequests(event),
});

export const actions: Actions = bookingReviewActions;
