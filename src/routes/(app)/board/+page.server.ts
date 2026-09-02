import { error } from "@sveltejs/kit";
import { serverApi } from "$lib/server/apiClient";
import type { PageServerLoad } from "./$types";

// The Prisma query + merge loop + "dsek.noll" position-id-prefix staben
// hack this used to be are gone - GET /board already returns sorted,
// staben-redacted board positions (see backend/DESIGN.md's nollning
// section and backend/CLAUDE.md's "Nollning routes"). serverApi (not
// $lib/api/client's plain `api`) so the staben-redaction branch - gated on
// the acting identity's member:see_staben policy - is correct during SSR
// too, not just after client-side hydration re-fetches with real cookies.
export const load: PageServerLoad = async (event) => {
  const res = await serverApi(event).GET("/board", {});
  if (res.error) throw error(500, "Failed to load board");
  return {
    boardPositions: res.data,
  };
};
