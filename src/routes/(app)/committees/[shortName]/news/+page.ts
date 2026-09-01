import { api } from "$lib/api/client";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ fetch, params }) => {
  // GET /committees no longer takes a shortName filter (superseded the old
  // minimal author-picker-only endpoint when committees were ported in
  // full - see backend/CLAUDE.md's "Directory routes" section) - look the
  // committee up by shortName directly instead.
  const committeeRes = await api.GET("/committees/{shortName}", {
    fetch,
    params: { path: { shortName: params.shortName } },
  });
  const committee = committeeRes.data;

  if (!committee) return { articles: [] };

  const articlesRes = await api.GET("/articles", {
    fetch,
    params: { query: { committeeId: committee.id, pageSize: 5 } },
  });
  return { articles: articlesRes.data?.articles ?? [] };
};
