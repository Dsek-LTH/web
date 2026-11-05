import { error } from "@sveltejs/kit";
import { bookingReviewActions } from "$lib/bookings/server/actions";
import { normalizeBooking } from "$lib/bookings/server/queries";
import { serverApi } from "$lib/server/apiClient";
import type { Actions, PageServerLoad } from "./$types";

// The pending requests with their conflicts; Go requires
// booking_request:update for the queue.
export const load: PageServerLoad = async (event) => {
  const res = await serverApi(event).GET("/booking-requests/review-queue", {});
  if (res.error) error(res.response.status === 403 ? 403 : 500);
  return {
    queue: (res.data ?? []).map((item) => ({
      ...normalizeBooking(item),
      conflicts: (item.conflicts ?? []).map(normalizeBooking),
    })),
  };
};

export const actions: Actions = bookingReviewActions;
