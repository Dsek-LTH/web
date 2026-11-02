import { bookingReviewPageActions } from "$lib/bookings/server/actions";
import {
  getBookingFormOptions,
  getBookingRequestOrThrow,
  getSuperValidatedBookingForm,
  toMemberSearchAttributes,
} from "$lib/bookings/server/queries";
import type { Actions, PageServerLoad } from "./$types";

// Accepting/rejecting requires booking_request:update in Go.
export const load: PageServerLoad = async (event) => {
  const [options, booking] = await Promise.all([
    getBookingFormOptions(event),
    getBookingRequestOrThrow(event, event.params.id),
  ]);

  return {
    ...options,
    form: await getSuperValidatedBookingForm(booking),
    booking,
    initialAccessMembers: booking.accessMembers.map(toMemberSearchAttributes),
  };
};

export const actions: Actions = bookingReviewPageActions;
