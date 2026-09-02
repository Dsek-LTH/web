import { api } from "$lib/api/client";
import { error } from "@sveltejs/kit";
import { getYearOrThrowSvelteError } from "$lib/utils/url";
import type { PageLoad } from "./$types";
import { DocumentTypes as dt } from "./types";

// Ported from +page.server.ts to a universal load calling the Go backend
// (backend/internal/documents.Service.ListMeetings) - see
// backend/CLAUDE.md's Phase 4 section. The board/guild/SRD/other
// filter+grouping logic (and notice/agenda/minutes resolution) now happens
// server-side in Go instead of here.
export const load: PageLoad = async ({ fetch, url }) => {
  const year = getYearOrThrowSvelteError(url);
  const type = url.searchParams.get("type") || dt.boardMeeting;

  const res = await api.GET("/documents", {
    fetch,
    params: { query: { type, year } },
  });
  if (res.error) throw error(500, "Failed to load documents");

  return {
    meetings: res.data ?? [],
  };
};
