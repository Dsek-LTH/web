import type { Actions } from "./$types";
import {
  availableSearchIndexes,
  type SearchDataWithType,
} from "$lib/search/searchTypes";
import { i18n } from "$lib/utils/i18n";

export const actions = {
  default: async (event) => {
    const data = await event.request.formData();

    const query = data.get("input");
    if (typeof query !== "string") return;
    if (query.trim().length === 0) {
      return {
        results: [],
      };
    }

    // Check which indexes were selected to search in
    const indexes = availableSearchIndexes.filter(
      (index) => data.get(index) === "on",
    );

    // Check which language to search in and get the correct route
    const apiRoute = i18n.resolveRoute("/api/search", event.locals.language);
    const url = new URL(apiRoute, event.request.url);
    url.searchParams.set("query", query);
    url.searchParams.set("indexes", JSON.stringify(indexes));
    const response = await event.fetch(url);
    if (!response.ok) {
      const error = new Response(await response.text(), {
        status: response.status,
      });
      error.headers.set("Content-Type", "text/html");
      console.log("Error from search API: ", error);
      return error;
    }
    const json: SearchDataWithType[] = await response.json();
    return {
      results: json,
    };
  },
} satisfies Actions;
