import { api } from "$lib/api/client";
import { goError } from "$lib/utils/access";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ fetch, params }) => {
  const res = await api.GET("/info-pages/{slug}", {
    fetch,
    params: { path: { slug: params.slug } },
  });
  if (res.error) goError(res.response, res.error, "Not found");
  return { page: res.data, slug: params.slug };
};
