import { api } from "$lib/api/client";
import { error } from "@sveltejs/kit";

// This page's +page.svelte is still <NotImplemented /> (the (nollning)/
// route tree's product UI isn't built yet); the load is real regardless.
// It uses the current season instead of the old hardcoded `year: 2025`
// filter.
export const load = async (event) => {
  const currentRes = await api.GET("/nollning/current", { fetch: event.fetch });
  const seasonId = currentRes.data?.season?.id;

  const summariesRes = seasonId
    ? await api.GET("/nollning/phadder-groups", {
        fetch: event.fetch,
        params: { query: { seasonId } },
      })
    : undefined;
  const summaries = summariesRes?.data ?? [];

  // The detail (member names) is for signed-in members; others get the
  // summaries. A group deleted in between (404) is dropped.
  const { user } = await event.parent();
  const phadderGroups = user?.memberId
    ? (
        await Promise.all(
          summaries.map(async (g) => {
            const res = await api.GET("/nollning/phadder-groups/{id}", {
              fetch: event.fetch,
              params: { path: { id: g.id } },
            });
            if (res.data) return res.data;
            if (res.response.status === 401) return g;
            if (res.response.status === 404) return undefined;
            error(
              res.response.status,
              res.error?.detail ?? "Failed to load phadder group",
            );
          }),
        )
      ).filter((g) => g !== undefined)
    : summaries;

  return {
    phadderGroups,
  };
};
