import { error } from "@sveltejs/kit";
import { serverApi } from "$lib/server/apiClient";
import { getUpcomingBookingRequests } from "./utils";

// booking_request:read/delete are enforced by the Go API itself
// (backend/internal/booking) - delete additionally allows the booker to
// remove their own request even without booking_request:delete, mirroring
// the old ZModel's `auth().memberId == bookerId` bypass exactly (Go
// enforces this now, not a client-side check here).
export const load = async (event) => {
  const api = serverApi(event);
  const [bookablesRes, bookingRequests] = await Promise.all([
    api.GET("/bookables", {}),
    getUpcomingBookingRequests(api),
  ]);

  return { bookables: bookablesRes.data ?? [], bookingRequests };
};

export const actions = {
  delete: async (event) => {
    const formData = await event.request.formData();
    const id = formData.get("id");
    if (!id || typeof id !== "string") {
      error(422, "Invalid booking request id");
    }
    await serverApi(event).DELETE("/booking-requests/{id}", {
      params: { path: { id } },
    });
  },
};
