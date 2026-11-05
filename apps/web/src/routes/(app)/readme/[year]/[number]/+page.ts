import { api } from "$lib/api/client";
import { error } from "@sveltejs/kit";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ params, fetch }) => {
  const year = parseInt(params.year);
  const number = parseInt(params.number);
  if (Number.isNaN(year) || Number.isNaN(number))
    error(404, "README not found");
  const res = await api.GET("/readmes/{year}/{number}", {
    fetch,
    params: { path: { year, number } },
  });
  if (res.error)
    error(
      res.response.status,
      res.response.status === 404 ? "README not found" : res.error.detail,
    );
  return { readme: res.data };
};
