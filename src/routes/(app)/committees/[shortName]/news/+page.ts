import { api } from "$lib/api/client";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ fetch, params }) => {
  const committeesRes = await api.GET("/committees", {
    fetch,
    params: { query: { shortName: params.shortName } },
  });
  const committee = committeesRes.data?.[0];

  if (!committee) return { articles: [] };

  const articlesRes = await api.GET("/articles", {
    fetch,
    params: { query: { committeeId: committee.id, pageSize: 5 } },
  });
  return { articles: articlesRes.data?.articles ?? [] };
};
