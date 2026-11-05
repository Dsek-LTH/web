import { api } from "$lib/api/client";
import { error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

// A thin proxy to Go's GET /alarm. Kept at this URL, answering "true" while
// an alarm-flagged event is running and "false" otherwise, for whatever
// polls it.
export const GET: RequestHandler = async ({ fetch }) => {
  const res = await api.GET("/alarm", { fetch });
  if (res.error) error(res.response.status, res.error.detail ?? "");
  return new Response(String(res.data.active), {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
};
