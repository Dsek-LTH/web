import { api } from "$lib/api/client";
import { goError } from "$lib/utils/access";
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
  if (res.error)
    goError(res.response, res.error, "Failed to load the songbook");

  return {
    songs: res.data.entries ?? [],
    pageCount: res.data.pageCount,
    currentPage: page,
    search,
  };
};
