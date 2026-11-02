import type { Actions } from "./$types";
import {
  availableSearchIndexes,
  type SearchDataWithType,
} from "$lib/search/searchTypes";
import { serverApi } from "$lib/server/apiClient";
import { fail } from "@sveltejs/kit";

// Kept as a form action (rather than a client call) because the search
// page and the command dialog both submit to it with use:enhance.
export const actions = {
  default: async (event) => {
    const data = await event.request.formData();

    const query = data.get("input");
    if (typeof query !== "string") return;
    if (query.trim().length === 0) {
      return {
        results: [] satisfies SearchDataWithType[],
      };
    }

    // Check which indexes were selected to search in
    const indexes = availableSearchIndexes.filter(
      (index) => data.get(index) === "on",
    );
    if (indexes.length === 0) {
      return {
        results: [] satisfies SearchDataWithType[],
      };
    }

    const limit = Number.parseInt(data.get("limit")?.toString() ?? "20");
    const offset = Number.parseInt(data.get("offset")?.toString() ?? "0");

    const res = await serverApi(event).GET("/search", {
      params: { query: { query, indexes, limit, offset } },
    });
    if (!res.data) {
      return fail(res.response.status, {
        statusDescription: res.response.statusText,
        message: res.error?.detail ?? "Search failed",
      });
    }
    return {
      // Go types each hit's data as a plain object; searchTypes.ts
      // describes what each index stores.
      results: res.data as unknown as SearchDataWithType[],
    };
  },
} satisfies Actions;
