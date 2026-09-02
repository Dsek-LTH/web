import { fail, superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import { bookingSchema } from "../../schema";
import { redirect } from "sveltekit-flash-message/server";
import * as m from "$paraglide/messages";
import { getBookingRequestOrThrow, getSuperValidatedForm } from "../../utils";
import { serverApi } from "$lib/server/apiClient";

export const load = async (event) => {
  const api = serverApi(event);
  const bookablesRes = await api.GET("/bookables", {});
  const bookingRequest = await getBookingRequestOrThrow(api, event.params.id);
  const form = await getSuperValidatedForm(bookingRequest);

  return { bookables: bookablesRes.data ?? [], form, booking: bookingRequest };
};

// Auth (booking_request:update, or the booker editing their own request)
// and the admin-vs-self status-reset-to-PENDING decision both now live
// entirely in Go (backend/internal/booking.Service.Update) - this is a
// real, deliberate fix, not a replicated gap: the old app's isAdmin check
// here tested apiNames.BOOKABLES.UPDATE (a bookable-resource policy),
// not BOOKINGS.UPDATE (the booking-request policy the actual Prisma write
// was gated on) - almost certainly a bug. See backend/CLAUDE.md's Booking
// routes section for the corrected behavior. No client-side authorize()
// check is replicated here, matching DESIGN.md's Principle #5.
export const actions = {
  default: async (event) => {
    const { request, params } = event;
    const api = serverApi(event);

    const form = await superValidate(request, zod4(bookingSchema));
    if (!form.valid) return fail(400, { form });
    const { start, end, name, bookables } = form.data;

    const updated = await api.PATCH("/booking-requests/{id}", {
      params: { path: { id: params.id } },
      body: {
        event: name,
        start: start.toISOString(),
        end: end.toISOString(),
        bookableIds: bookables,
      },
    });
    if (updated.error) return fail(400, { form });

    throw redirect(
      `/booking`,
      {
        message: m.booking_requestSent(),
        type: "success",
      },
      event,
    );
  },
};
