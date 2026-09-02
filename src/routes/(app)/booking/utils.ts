import { error, type RequestEvent } from "@sveltejs/kit";
import type { Actions } from "./$types";
import { superValidate } from "sveltekit-superforms/server";
import { zod4 } from "sveltekit-superforms/adapters";
import { bookingSchema } from "./schema";
import * as m from "$paraglide/messages";
import { serverApi } from "$lib/server/apiClient";
import type { components } from "$lib/api/schema";

type BookingRequest = components["schemas"]["BookingRequest"];

// accept/reject just proxy to Go now (backend/internal/booking.Service.
// SetStatus) - the booker notification that used to live in this file's
// own performAction is handled entirely server-side by Go, see
// backend/CLAUDE.md's Booking routes section.
export const actions: Actions = {
  accept: async (event) => {
    await performAction(event, true);
  },
  reject: async (event) => {
    await performAction(event, false);
  },
};

export async function getUpcomingBookingRequests(api: ReturnType<typeof serverApi>) {
  const res = await api.GET("/booking-requests", {});
  return res.data ?? [];
}

export async function getBookingRequestOrThrow(
  api: ReturnType<typeof serverApi>,
  id: string,
) {
  const res = await api.GET("/booking-requests/{id}", {
    params: { path: { id } },
  });
  if (res.error) throw error(404, m.booking_errors_notFound());
  return res.data;
}

export async function getSuperValidatedForm(bookingRequest: BookingRequest) {
  const initialData = {
    name: bookingRequest.event ?? undefined,
    start: bookingRequest.start ? new Date(bookingRequest.start) : undefined,
    end: bookingRequest.end ? new Date(bookingRequest.end) : undefined,
    bookables: (bookingRequest.bookables ?? []).map((bookable) => bookable.id),
  };
  return await superValidate(initialData, zod4(bookingSchema));
}

async function performAction(event: RequestEvent, accepted: boolean) {
  const formData = await event.request.formData();
  const id = formData.get("id");
  if (!id || typeof id !== "string") return;

  const api = serverApi(event);
  if (accepted) {
    await api.POST("/booking-requests/{id}/accept", { params: { path: { id } } });
  } else {
    await api.POST("/booking-requests/{id}/reject", { params: { path: { id } } });
  }
}
