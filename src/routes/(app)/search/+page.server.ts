import type { Hits } from "meilisearch";
import type { Actions } from "./$types";
import type { SearchDataWithType } from "$lib/search/searchTypes";

export const actions = {
  default: async (event) => {
    const data = await event.request.formData();

    const query = data.get("input");
    if (typeof query !== "string") return;

    const includeMembers = data.get("members") === "on";
    const includeEvents = data.get("events") === "on";
    const includeArticles = data.get("articles") === "on";
    const includePositions = data.get("positions") === "on";
    const includeSongs = data.get("songs") === "on";
    const indexes = [];
    if (includeMembers) indexes.push("members");
    if (includeEvents) indexes.push("events");
    if (includeArticles) indexes.push("articles");
    if (includePositions) indexes.push("positions");
    if (includeSongs) indexes.push("songs");

    const language = data.get("language") === "en" ? "en" : "sv";

    const url = new URL("/api/search", event.request.url);
    url.searchParams.set("query", query);
    url.searchParams.set("indexes", JSON.stringify(indexes));
    url.searchParams.set("language", language);
    const response = await event.fetch(url);
    if (!response.ok) {
      // silently fail
      return;
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
