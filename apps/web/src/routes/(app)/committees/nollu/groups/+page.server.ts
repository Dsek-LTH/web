import { error } from "@sveltejs/kit";
import { serverApi } from "$lib/server/apiClient";
import type { PageServerLoad } from "./$types";
import { committeeLoad } from "../../committee";
import { committeeActions } from "../../committee.server";
import { getYearOrThrowSvelteError } from "$lib/utils/url";

export const load: PageServerLoad = async (event) => {
  const { url, fetch } = event;
  const api = serverApi(event);
  const currentYear = new Date().getFullYear();
  // Allow to see committees from 1982 to the NEXT year
  const year = getYearOrThrowSvelteError(url, {
    upperBound: currentYear + 1,
  });

  // "year" is now resolved against a real nollning_seasons row instead of
  // phadder_groups.year (dropped - see backend's Phase 2 nollning
  // redesign). No season for the requested year just means an empty list.
  const seasonsRes = await api.GET("/nollning/seasons");
  if (seasonsRes.error)
    error(
      seasonsRes.response.status,
      seasonsRes.error.detail ?? "Failed to load nollning seasons",
    );
  const season = (seasonsRes.data ?? []).find((s) => s.year === year);

  const summariesRes = season
    ? await api.GET("/nollning/phadder-groups", {
        params: { query: { seasonId: season.id } },
      })
    : undefined;
  if (summariesRes?.error)
    error(
      summariesRes.response.status,
      summariesRes.error.detail ?? "Failed to load phadder groups",
    );
  const summaries = summariesRes?.data ?? [];

  // ListGroups only returns counts, not full nollor/phaddrar - fetch each
  // group's detail. Low-traffic page, small N (one nollning year's worth
  // of groups), so the N+1 isn't worth a broader API change for. The
  // detail (member names) is for signed-in members; others get the
  // summary, so they still see the groups.
  const phadderGroups = await Promise.all(
    summaries.map((g) =>
      api
        .GET("/nollning/phadder-groups/{id}", {
          params: { path: { id: g.id } },
        })
        .then((res) => res.data ?? g),
    ),
  );

  return committeeLoad(fetch, "nollu", url).then((data) => ({
    ...data,
    phadderGroups,
  }));
};

export const actions = committeeActions("nollu");
