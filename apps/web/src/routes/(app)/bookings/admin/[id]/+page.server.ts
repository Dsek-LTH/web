import { bookingReviewPageActions } from "$lib/bookings/server/actions";
import {
  getBookingFormOptions,
  getBookingRequestOrThrow,
  getSuperValidatedBookingForm,
  toMemberSearchAttributes,
} from "$lib/bookings/server/queries";
import type { Actions, PageServerLoad } from "./$types";
import { requirePolicy } from "$lib/utils/access";
import apiNames from "$lib/utils/apiNames";

// Accepting/rejecting requires booking_request:update in Go.
export const load: PageServerLoad = async (event) => {
  requirePolicy(event.locals.user, apiNames.BOOKINGS.UPDATE);
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
