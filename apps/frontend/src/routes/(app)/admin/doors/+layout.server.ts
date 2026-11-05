import { serverApi } from "$lib/server/apiClient";
import { error } from "@sveltejs/kit";
import type { LayoutServerLoad } from "./$types";

// core:access:door:read (Go's apinames.DoorRead) is enforced by the Go API
// itself - see backend/internal/doors. No permission check here:
// authorization is Go's alone. A server load (not +layout.ts) because
// edit/[slug]/+page.server.ts reads `doors` through parent().
export const load: LayoutServerLoad = async (event) => {
  const { params } = event;
  const res = await serverApi(event).GET("/doors", {});
  if (res.error)
    error(res.response.status, res.error.detail ?? "Failed to load doors");
  return {
    doors: res.data ?? [],
    slug: params.slug,
  };
};
