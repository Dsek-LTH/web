import apiNames from "$lib/utils/apiNames";
import { authorize } from "$lib/utils/authorization";
import type { PageServerLoad } from "./$types";
import { actions, getUpcomingBookingRequests } from "../utils";
import { serverApi } from "$lib/server/apiClient";

export const load: PageServerLoad = async (event) => {
  const { locals } = event;
  authorize(apiNames.BOOKINGS.UPDATE, locals.user);

  const bookingRequests = await getUpcomingBookingRequests(serverApi(event));

  return { bookingRequests };
};

export { actions };
