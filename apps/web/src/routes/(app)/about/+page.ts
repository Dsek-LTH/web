import { error } from "@sveltejs/kit";
import { api } from "$lib/api/client";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ fetch }) => {
  const {
    data,
    error: err,
    response,
  } = await api.GET("/committees", {
    fetch,
  });
  if (err) error(response.status, err.detail ?? "Failed to load committees");
  return {
    committees: data ?? [],
  };
};
