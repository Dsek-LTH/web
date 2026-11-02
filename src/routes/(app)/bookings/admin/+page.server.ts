import apiNames from "$lib/utils/apiNames";
import { authorize } from "$lib/utils/authorization";
import { bookingReviewActions } from "$lib/bookings/server/actions";
import { getUpcomingBookingRequests } from "$lib/bookings/server/queries";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async (event) => {
  const { locals } = event;
  authorize(apiNames.BOOKINGS.UPDATE, locals.user);

  const bookingRequests = await getUpcomingBookingRequests(serverApi(event));

  return { bookingRequests };
};

export const actions: Actions = bookingReviewActions;
