import { api } from "$lib/api/client";

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

  const phadderGroups = (
    await Promise.all(
      summaries.map((g) =>
        api
          .GET("/nollning/phadder-groups/{id}", {
            fetch: event.fetch,
            params: { path: { id: g.id } },
          })
          .then((res) => res.data),
      ),
    )
  ).filter((g) => g !== undefined);

  return {
    phadderGroups,
  };
};
