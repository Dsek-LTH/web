import { api } from "$lib/api/client";
import { error } from "@sveltejs/kit";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ fetch }) => {
  const res = await api.GET("/elections", { fetch });
  if (res.error) throw error(500, "Failed to load elections");

  return {
    openElections: res.data ?? [],
  };
};
