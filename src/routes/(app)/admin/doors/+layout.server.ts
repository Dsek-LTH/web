import { serverApi } from "$lib/server/apiClient";
import type { LayoutServerLoad } from "./$types";

// core:access:door:read (Go's apinames.DoorRead) is enforced by the Go API
// itself - see backend/internal/doors. No authorize() call here, matching
// DESIGN.md's Principle #5.
export const load: LayoutServerLoad = async (event) => {
  const { params } = event;
  const res = await serverApi(event).GET("/doors", {});
  if (res.error) throw new Error("Failed to load doors");
  return {
    doors: res.data ?? [],
    slug: params.slug,
  };
};
