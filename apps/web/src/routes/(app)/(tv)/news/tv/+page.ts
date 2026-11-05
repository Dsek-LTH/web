import { api } from "$lib/api/client";
import type { PageLoad } from "./$types";

// The latest published articles, same as the old getAllArticles() default
// page.
export const load: PageLoad = async ({ fetch }) => {
  const res = await api.GET("/articles", {
    fetch,
    params: { query: { page: 1, pageSize: 10 } },
  });
  return { articles: res.data?.articles ?? [] };
};
