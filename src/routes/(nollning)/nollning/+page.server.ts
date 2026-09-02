import { api } from "$lib/api/client";

// This page's +page.svelte is still <NotImplemented /> (part of the
// (nollning)/ route tree's product UI, out of scope for this pass - see
// backend/DESIGN.md's nollning section) - the load below is still ported
// to the Go backend regardless, same "port the server logic even without
// a page.svelte" precedent used elsewhere this pass. Replaces the old
// hardcoded `year: 2025` filter (one of the landmine dates DESIGN.md's
// nollning survey called out by name) with the actual current season.
export const load = async ({ fetch }) => {
  const currentRes = await api.GET("/nollning/current", { fetch });
  const seasonId = currentRes.data?.season?.id;

  const summariesRes = seasonId
    ? await api.GET("/nollning/groups", { fetch, params: { query: { seasonId } } })
    : undefined;
  const summaries = summariesRes?.data ?? [];

  const phadderGroups = (
    await Promise.all(
      summaries.map((g) =>
        api
          .GET("/nollning/groups/{id}", { fetch, params: { path: { id: g.id } } })
          .then((res) => res.data),
      ),
    )
  ).filter((g) => g !== undefined);

  return {
    phadderGroups,
  };
};
