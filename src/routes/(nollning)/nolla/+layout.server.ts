import { redirect } from "@sveltejs/kit";
import { api } from "$lib/api/client";

// Replaces the old hardcoded CUTOFF_DATE - see backend's Phase 2 nollning
// redesign.
export const load = async ({ fetch }) => {
  const res = await api.GET("/nollning/current", { fetch });
  if (res.data?.phase === "post_reveal") {
    redirect(302, "/nollning");
  }
};
