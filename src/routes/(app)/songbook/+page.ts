import { api } from "$lib/api/client";
import { error } from "@sveltejs/kit";
import type { PageLoad } from "./$types";

// The printed songbook's entries in page order. A numeric search finds a
// page, anything else searches song titles (Go decides which).
export const load: PageLoad = async ({ fetch, url }) => {
  const search = url.searchParams.get("search") || "";
  const page = parseInt(url.searchParams.get("page") || "1", 10);

  const res = await api.GET("/songbook-entries", {
    fetch,
    params: { query: { search: search || undefined, page, pageSize: 20 } },
  });
  if (res.error) error(res.response.status === 403 ? 403 : 500);

  return {
    songs: res.data.entries ?? [],
    pageCount: res.data.pageCount,
    currentPage: page,
    search,
  };
};
