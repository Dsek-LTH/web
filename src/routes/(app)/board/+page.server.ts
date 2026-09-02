import { error } from "@sveltejs/kit";
import { api } from "$lib/api/client";
import type { PageServerLoad } from "./$types";

// The Prisma query + merge loop + "dsek.noll" position-id-prefix staben
// hack this used to be are gone - GET /board already returns sorted,
// staben-redacted board positions (see backend/DESIGN.md's nollning
// section and backend/CLAUDE.md's "Nollning routes").
export const load: PageServerLoad = async ({ fetch }) => {
  const res = await api.GET("/board", { fetch });
  if (res.error) throw error(500, "Failed to load board");
  return {
    boardPositions: res.data,
  };
};
