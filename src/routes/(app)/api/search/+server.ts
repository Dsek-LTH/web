import type { RequestHandler } from "@sveltejs/kit";
import { meilisearch } from "./meilisearch";

/**
 * This endpoint is used to search multiple indexes at once.
 * It takes a query and a list of indexes to search in.
 * It will return the results from each index.
 * Example usage:
 * GET /api/search?query=oddput clementin&indexes=["members", "articles"]
 * This will search for "oddput clementin" in the "members" and "articles" indexes.
 */
export const GET: RequestHandler = async ({ url }) => {
  const query = url.searchParams.get("query");
  if (!query) {
    return new Response("Missing query", { status: 400 });
  }
  const indexes = JSON.parse(url.searchParams.get("indexes") ?? "[]");
  if (!Array.isArray(indexes)) {
    return new Response("Invalid indexes, please provide an array of strings", {
      status: 400,
    });
  }

  if (indexes.length === 0) {
    return new Response("Missing type", { status: 400 });
  }

  for (const t of indexes) {
    if (typeof t !== "string") {
      return new Response(
        "Invalid indexes, please provide an array of strings",
        {
          status: 400,
        },
      );
    }
  }

  const search = await meilisearch.multiSearch({
    queries: indexes.map((index) => ({ indexUid: index, q: query, limit: 5 })),
  });

  return new Response(JSON.stringify(search), {
    headers: {
      "Content-Type": "application/json",
    },
  });
};
