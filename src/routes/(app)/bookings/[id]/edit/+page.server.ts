import { error } from "@sveltejs/kit";
import * as m from "$paraglide/messages";
import apiNames from "$lib/utils/apiNames";
import { saveBookingRequest } from "$lib/bookings/server/actions";
import {
  getBookingFormOptions,
  getBookingRequestOrThrow,
  getSuperValidatedBookingForm,
  toMemberSearchAttributes,
} from "$lib/bookings/server/queries";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async (event) => {
  const { locals, params } = event;
  const [options, booking] = await Promise.all([
    getBookingFormOptions(event),
    getBookingRequestOrThrow(event, params.id),
  ]);
  // Only decides what to show - Go itself rejects an edit by anyone but
  // the booker or an admin, and resets a booker's edit to pending.
  const isAdmin = !!locals.user?.policies?.includes(apiNames.BOOKINGS.UPDATE);
  const isOwner =
    !!locals.user?.memberId && booking.booker?.id === locals.user.memberId;
  if (!isAdmin && !isOwner) {
    error(403, m.booking_errors_notAuthorized());
  }

  return {
    ...options,
    form: await getSuperValidatedBookingForm(booking),
    booking,
    isAdmin,
    initialAccessMembers: booking.accessMembers.map(toMemberSearchAttributes),
  };
};

export const actions: Actions = {
  default: (event) => saveBookingRequest(event, event.params.id),
};
