import { error } from "@sveltejs/kit";
import { api } from "$lib/api/client";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ fetch, params }) => {
  const res = await api.GET("/info/{slug}", {
    fetch,
    params: { path: { slug: params.slug } },
  });
  if (res.error) {
    throw error(404, { message: "Not found" });
  }
  return { page: res.data, slug: params.slug };
};
