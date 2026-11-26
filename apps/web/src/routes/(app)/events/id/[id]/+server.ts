import { serverApi } from "$lib/server/apiClient";
import { error, redirect } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

// Legacy /events/id/{id} links redirect to the event's slug URL. Go
// generates a slug first for an event that predates them.
export const GET: RequestHandler = async (event) => {
  const res = await serverApi(event).GET("/events/by-id/{id}", {
    params: { path: { id: event.params.id } },
  });
  if (res.error)
    throw error(res.response.status, res.error.detail ?? "Event not found");
  throw redirect(302, `/events/${res.data.slug}`);
};
