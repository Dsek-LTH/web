import { api } from "$lib/api/client";
import { error } from "@sveltejs/kit";
import { getYearOrThrowSvelteError } from "$lib/utils/url";
import type { PageLoad } from "./$types";

// Ported from +page.server.ts to a universal load calling the Go backend
// (backend/internal/documents.Service.ListRequirements) - see
// backend/CLAUDE.md's Phase 4 section. The .svelte here stays
// <NotImplemented /> until Phase 13 (per DESIGN.md's Principle #6 - this
// route had no real page before this pass either), but the load is ported
// now rather than left on the now-broken Prisma-less path. Delete (when a
// real page exists) should call DELETE /documents/requirements directly
// from the client, matching RemoveArticleDialog.svelte's pattern - no
// SvelteKit action, per Principle #5 - rather than reintroducing the old
// deleteFile form action, which also had the wrong-bucket bug this port
// fixes (see backend/internal/documents.Service.DeleteRequirement).
export const load: PageLoad = async ({ fetch, url }) => {
  const year = getYearOrThrowSvelteError(url);

  const res = await api.GET("/documents/requirements", {
    fetch,
    params: { query: { year } },
  });
  if (res.error) throw error(500, "Failed to load requirement profiles");

  return {
    folders: res.data ?? [],
  };
};
