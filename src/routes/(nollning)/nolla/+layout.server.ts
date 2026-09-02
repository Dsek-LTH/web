import { redirect } from "@sveltejs/kit";
import { serverApi } from "$lib/server/apiClient";

// Replaces the old hardcoded CUTOFF_DATE - see backend's Phase 2 nollning
// redesign.
export const load = async (event) => {
  const res = await serverApi(event).GET("/nollning/current", {});
  if (res.data?.phase === "post_reveal") {
    redirect(302, "/nollning");
  }
};
