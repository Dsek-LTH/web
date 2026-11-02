import { api } from "$lib/api/client";
import { error } from "@sveltejs/kit";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ fetch, url }) => {
  const search = url.searchParams.get("search") || "";
  const categoryFilter = url.searchParams.getAll("category");
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const showDeleted = url.searchParams.get("show-deleted") === "true";

  const [songsRes, categoryMapRes] = await Promise.all([
    api.GET("/songs", {
      fetch,
      params: {
        query: {
          search: search || undefined,
          category: categoryFilter.length > 0 ? categoryFilter : undefined,
          showDeleted,
          page,
        },
      },
    }),
    // Go decides (from the acting identity, per DESIGN.md's Principle #5)
    // whether showDeleted is actually honored - this just forwards the
    // caller's request, same as the old app's canAccessDeletedSongs gate.
    api.GET("/songs/categories/grouped", {
      fetch,
      params: { query: { includeDeleted: showDeleted } },
    }),
  ]);
  if (songsRes.error) throw error(500, "Failed to load songs");

  const categoryMap = categoryMapRes.data ?? {};

  return {
    songs: songsRes.data.songs ?? [],
    pageCount: songsRes.data.pageCount,
    categories: Object.keys(categoryMap),
    categoryMap,
    currentPage: page,
    search,
    categoryFilter,
    showDeleted,
  };
};
