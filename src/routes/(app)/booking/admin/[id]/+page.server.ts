import apiNames from "$lib/utils/apiNames";
import { authorize } from "$lib/utils/authorization";
import {
  actions,
  getUpcomingBookingRequests,
  getBookingRequestOrThrow,
  getSuperValidatedForm,
} from "../../utils";
import { serverApi } from "$lib/server/apiClient";

export const load = async (event) => {
  const { locals, params } = event;
  authorize(apiNames.BOOKINGS.UPDATE, locals.user);
  const api = serverApi(event);

  const [bookablesRes, bookingRequests, bookingRequest] = await Promise.all([
    api.GET("/bookables", {}),
    getUpcomingBookingRequests(api),
    getBookingRequestOrThrow(api, params.id),
  ]);
  const form = await getSuperValidatedForm(bookingRequest);

  return {
    bookables: bookablesRes.data ?? [],
    form,
    booking: bookingRequest,
    // The old app fetched this same "start >= now-1week" window twice
    // (once with a booker include, once without) for allBookingRequests
    // vs bookingRequests - Go's ListUpcomingBookingRequests already
    // includes both, so one fetch now serves both fields.
    allBookingRequests: bookingRequests,
    bookingRequests,
  };
};

export { actions };
