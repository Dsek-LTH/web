import { error, fail, type RequestEvent } from "@sveltejs/kit";
import { z } from "zod";
import { superValidate } from "sveltekit-superforms/server";
import { zod4 } from "sveltekit-superforms/adapters";
import { redirect } from "sveltekit-flash-message/server";
import * as m from "$paraglide/messages";
import { bookingSchema } from "$lib/bookings/schema";
import { stockholmToIso } from "$lib/bookings/server/queries";
import { serverApi } from "$lib/server/apiClient";

// Every booking mutation is a Go call (apps/api/internal/booking): who may
// create/edit/accept/delete, the KM notification on a new request, the
// booker's status notification, and the door access an acceptance grants
// are all decided there, not here.

/** Creates or (with `id`) edits a booking request from the booking form. */
export async function saveBookingRequest(event: RequestEvent, id?: string) {
  const form = await superValidate(event.request, zod4(bookingSchema));
  if (!form.valid) return fail(400, { form });
  const { start, end, name, bookables, accessDoors, accessMemberIds } =
    form.data;

  const body = {
    event: name,
    start: stockholmToIso(start),
    end: stockholmToIso(end),
    bookableIds: bookables,
    accessDoors,
    accessMemberIds,
  };
  const api = serverApi(event);
  const res = id
    ? await api.PUT("/booking-requests/{id}", {
        params: { path: { id } },
        body,
      })
    : await api.POST("/booking-requests", { body });
  if (res.error) {
    if (res.response.status === 403) {
      error(403, m.booking_errors_notAuthorized());
    }
    return fail(400, { form });
  }

  throw redirect(
    `/bookings`,
    { message: m.booking_requestSent(), type: "success" },
    event,
  );
}

const reviewAccessSchema = z.object({
  accessDoors: z.array(z.string()).default([]),
  accessMemberIds: z.array(z.uuid()).default([]),
});

async function updateBookingStatus(
  event: RequestEvent,
  status: "ACCEPTED" | "DENIED",
  // Only the dedicated review page lets the admin edit the requested
  // doors/members before accepting. The calendar and table quick-actions
  // don't submit that data at all, so sending it there would wipe out
  // whatever the booker originally requested.
  { updateAccessRequest = false }: { updateAccessRequest?: boolean } = {},
) {
  const formData = await event.request.formData();
  const id = formData.get("id");
  if (!id || typeof id !== "string") {
    return fail(422, { message: m.booking_errors_invalidId() });
  }

  let access: z.infer<typeof reviewAccessSchema> | undefined;
  if (updateAccessRequest) {
    const accessForm = await superValidate(formData, zod4(reviewAccessSchema));
    if (!accessForm.valid) {
      return fail(400, { message: m.booking_errors_invalidAccessRequest() });
    }
    access = accessForm.data;
  }

  const api = serverApi(event);
  const params = { path: { id } };
  const res =
    status === "ACCEPTED"
      ? await api.POST("/booking-requests/{id}/accept", {
          params,
          body: access,
        })
      : await api.POST("/booking-requests/{id}/reject", { params });
  if (res.error) {
    return fail(res.response.status === 404 ? 404 : 403, {
      message:
        res.response.status === 404
          ? m.booking_errors_notFound()
          : m.booking_errors_notAuthorized(),
    });
  }

  return { success: true };
}

export async function deleteBookingRequest(event: RequestEvent) {
  const formData = await event.request.formData();
  const id = formData.get("id");
  if (!id || typeof id !== "string") {
    return fail(422, { message: m.booking_errors_invalidId() });
  }

  // Go allows the booker themself or an admin.
  const res = await serverApi(event).DELETE("/booking-requests/{id}", {
    params: { path: { id } },
  });
  if (res.error) {
    return fail(res.response.status === 404 ? 404 : 403, {
      message:
        res.response.status === 404
          ? m.booking_errors_notFound()
          : m.booking_errors_notAuthorized(),
    });
  }

  return { success: true };
}

export const bookingReviewActions = {
  accept: (event: RequestEvent) => updateBookingStatus(event, "ACCEPTED"),
  reject: (event: RequestEvent) => updateBookingStatus(event, "DENIED"),
  delete: deleteBookingRequest,
};

// Used on the dedicated review page (/bookings/admin/[id]), where accepting
// or rejecting should send the admin back to the booking list. The calendar
// and table views use bookingReviewActions instead, since they update the
// booking in place and must stay on the same page.
async function updateBookingStatusAndRedirect(
  event: RequestEvent,
  status: "ACCEPTED" | "DENIED",
) {
  const result = await updateBookingStatus(event, status, {
    updateAccessRequest: true,
  });
  if (!("success" in result && result.success)) {
    return result;
  }

  throw redirect(
    `/bookings/admin`,
    {
      message:
        status === "ACCEPTED" ? m.booking_accepted() : m.booking_denied(),
      type: "success",
    },
    event,
  );
}

export const bookingReviewPageActions = {
  accept: (event: RequestEvent) =>
    updateBookingStatusAndRedirect(event, "ACCEPTED"),
  reject: (event: RequestEvent) =>
    updateBookingStatusAndRedirect(event, "DENIED"),
  delete: deleteBookingRequest,
};
