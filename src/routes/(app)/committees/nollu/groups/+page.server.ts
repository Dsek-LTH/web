import { error } from "@sveltejs/kit";
import { api } from "$lib/api/client";
import type { PageServerLoad } from "./$types";
import { committeeActions, committeeLoad } from "../../committee";
import { getYearOrThrowSvelteError } from "$lib/utils/url";

export const load: PageServerLoad = async ({ url, fetch }) => {
  const currentYear = new Date().getFullYear();
  // Allow to see committees from 1982 to the NEXT year
  const year = getYearOrThrowSvelteError(url, {
    upperBound: currentYear + 1,
  });

  // "year" is now resolved against a real nollning_seasons row instead of
  // phadder_groups.year (dropped - see backend's Phase 2 nollning
  // redesign). No season for the requested year just means an empty list.
  const seasonsRes = await api.GET("/nollning/seasons", { fetch });
  if (seasonsRes.error) throw error(500, "Failed to load nollning seasons");
  const season = (seasonsRes.data ?? []).find((s) => s.year === year);

  const summariesRes = season
    ? await api.GET("/nollning/groups", {
        fetch,
        params: { query: { seasonId: season.id } },
      })
    : undefined;
  if (summariesRes?.error) throw error(500, "Failed to load phadder groups");
  const summaries = summariesRes?.data ?? [];

  // ListGroups only returns counts, not full nollor/phaddrar - fetch each
  // group's detail. Low-traffic page, small N (one nollning year's worth
  // of groups), so the N+1 isn't worth a broader API change for.
  const phadderGroups = (
    await Promise.all(
      summaries.map((g) =>
        api
          .GET("/nollning/groups/{id}", {
            fetch,
            params: { path: { id: g.id } },
          })
          .then((res) => res.data),
      ),
    )
  ).filter((g) => g !== undefined);

  return committeeLoad(fetch, "nollu", url).then((data) => ({
    ...data,
    phadderGroups,
  }));
};

export const actions = committeeActions("nollu");
