import type { Hits } from "meilisearch";
import type { Actions } from "./$types";
import {
  availableSearchIndexes,
  type SearchDataWithType,
} from "$lib/search/searchTypes";

export const actions = {
  default: async (event) => {
    const data = await event.request.formData();

    const query = data.get("input");
    if (typeof query !== "string") return;

    // Check which indexes were selected to search in
    const indexes = availableSearchIndexes.filter(
      (index) => data.get(index) === "on",
    );

    const language = data.get("language") === "en" ? "en" : "sv";

    const url = new URL("/api/search", event.request.url);
    url.searchParams.set("query", query);
    url.searchParams.set("indexes", JSON.stringify(indexes));
    url.searchParams.set("language", language);
    const response = await event.fetch(url);
    if (!response.ok) {
      const error = new Response(await response.text(), {
        status: response.status,
      });
      error.headers.set("Content-Type", "text/html");
      console.log("Error from search API: ", error);
      return error;
    }
    const json: Hits = await response.json();
    return {
      results: json.map((hit) => {
        return {
          data: hit,
          type: hit._federation?.indexUid,
        } as SearchDataWithType;
      }),
    };
  },
} satisfies Actions;
