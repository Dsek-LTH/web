import { api } from "$lib/api/client";
import { error } from "@sveltejs/kit";
import type { PageLoad } from "./$types";

// Ported from +page.server.ts to a universal load calling the Go backend
// (apps/api/internal/gallery).
// Staben redaction of pre-reveal albums now happens for real server-side
// (internal/gallery.Service.ListAlbums), replacing the old
// isNollningPeriod/getNollningStart AdminSetting-based date hack.
export const load: PageLoad = async ({ fetch }) => {
  const res = await api.GET("/albums", { fetch });
  if (res.error)
    error(res.response.status, res.error.detail ?? "Failed to load albums");

  return {
    albums: res.data ?? [],
  };
};
