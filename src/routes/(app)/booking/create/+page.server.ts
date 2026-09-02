import { fail } from "@sveltejs/kit";
import { superValidate } from "sveltekit-superforms/server";
import { zod4 } from "sveltekit-superforms/adapters";
import * as m from "$paraglide/messages";
import { bookingSchema } from "../schema";
import { redirect } from "sveltekit-flash-message/server";
import { serverApi } from "$lib/server/apiClient";

export const load = async (event) => {
  const bookablesRes = await serverApi(event).GET("/bookables", {});
  const form = await superValidate(zod4(bookingSchema));
  return { bookables: bookablesRes.data ?? [], form };
};

export const actions = {
  // Notifications (to the building manager on a new request, to the
  // booker on a later status change) are handled entirely server-side by
  // Go now (backend/internal/booking.Service) - no sendNotification call
  // needed here, see backend/CLAUDE.md's Booking routes section. The
  // response also carries a non-blocking `conflicts` list (other requests
  // overlapping this one for a shared bookable) - not surfaced anywhere
  // yet since this page has no real UI (still <NotImplemented />), left
  // for whoever builds it in Phase 13.
  default: async (event) => {
    const { request } = event;
    const api = serverApi(event);

    const form = await superValidate(request, zod4(bookingSchema));
    if (!form.valid) return fail(400, { form });
    const { start, end, name, bookables } = form.data;

    const created = await api.POST("/booking-requests", {
      body: {
        event: name,
        start: start.toISOString(),
        end: end.toISOString(),
        bookableIds: bookables,
      },
    });
    if (created.error) return fail(400, { form });

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
