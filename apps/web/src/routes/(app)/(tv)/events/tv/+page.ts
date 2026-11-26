import { api } from "$lib/api/client";
import type { PageLoad } from "./$types";

// The first page of upcoming events, same as the old getEvents() default.
export const load: PageLoad = async ({ fetch }) => {
  const res = await api.GET("/events", {
    fetch,
    params: { query: { span: "upcoming", page: 1, pageSize: 10 } },
  });
  return { events: res.data?.events ?? [] };
};
