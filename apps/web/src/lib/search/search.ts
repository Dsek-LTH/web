import { api } from "$lib/api/client";
import type { SearchDataWithType, SearchableIndex } from "./searchTypes";

/**
 * Searches the given indexes through the Go backend's GET /search. Returns
 * no results on failure, which is all the type-ahead pickers need. The
 * members index only answers a signed-in caller.
 */
export async function searchIndexes(
  query: string,
  indexes: SearchableIndex[],
  pageSize = 20,
): Promise<SearchDataWithType[]> {
  const res = await api.GET("/search", {
    params: { query: { query, indexes, pageSize } },
  });
  return res.data ?? [];
}
