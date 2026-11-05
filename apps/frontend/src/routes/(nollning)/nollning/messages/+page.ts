import { api } from "$lib/api/client";
import { error } from "@sveltejs/kit";
import type { PageLoad } from "./$types";

// The current nollning season's articles, newest first.
export const load: PageLoad = async ({ fetch }) => {
  const current = await api.GET("/nollning/current", { fetch });
  if (current.error)
    error(current.response.status, current.error.detail ?? "Failed to load");
  const seasonId = current.data.season?.id;
  if (!seasonId) return { messages: [] };

  const res = await api.GET("/articles", {
    fetch,
    params: { query: { nollningSeasonId: seasonId, pageSize: 100 } },
  });
  if (res.error)
    error(res.response.status, res.error.detail ?? "Failed to load messages");
  return { messages: res.data.articles };
};
