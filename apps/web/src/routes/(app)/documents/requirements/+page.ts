import { api } from "$lib/api/client";
import { error } from "@sveltejs/kit";
import { getYearOrThrowSvelteError } from "$lib/utils/url";
import type { PageLoad } from "./$types";

// A universal load calling the Go backend
// (apps/api/internal/documents.Service.ListRequirements). The page (upstream #1291) deletes
// a file by calling DELETE /requirement-profiles directly from the
// client - no SvelteKit action - rather than the old
// deleteFile form action, which also had the wrong-bucket bug Go fixes
// (see apps/api/internal/documents.Service.DeleteRequirement).
export const load: PageLoad = async ({ fetch, url }) => {
  const year = getYearOrThrowSvelteError(url);

  const res = await api.GET("/requirement-profiles", {
    fetch,
    params: { query: { year } },
  });
  if (res.error)
    error(
      res.response.status,
      res.error.detail ?? "Failed to load requirement profiles",
    );

  return {
    folders: res.data ?? [],
  };
};
