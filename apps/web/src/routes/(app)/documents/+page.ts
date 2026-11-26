import { api } from "$lib/api/client";
import { error } from "@sveltejs/kit";
import { getYearOrThrowSvelteError } from "$lib/utils/url";
import type { PageLoad } from "./$types";
import { DocumentTypes as dt, isMeetingType } from "./types";

// Ported from +page.server.ts to a universal load calling the Go backend
// (apps/api/internal/documents.Service.ListMeetings). The board/guild/SRD/other
// filter+grouping logic (and notice/agenda/minutes resolution) now happens
// server-side in Go instead of here.
export const load: PageLoad = async ({ fetch, url }) => {
  const year = getYearOrThrowSvelteError(url);
  const requested = url.searchParams.get("type");
  const type = isMeetingType(requested) ? requested : dt.boardMeeting;

  const res = await api.GET("/meeting-documents", {
    fetch,
    params: { query: { type, year } },
  });
  if (res.error)
    error(res.response.status, res.error.detail ?? "Failed to load documents");

  return {
    meetings: res.data ?? [],
  };
};
