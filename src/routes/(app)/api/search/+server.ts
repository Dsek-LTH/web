import type { RequestHandler } from "@sveltejs/kit";
import { meilisearch } from "$lib/search/meilisearch";
import {
  getFederatedWeight,
  getSearchableAttributes,
} from "$lib/search/searchHelpers";
import type { Hits } from "meilisearch";

/**
 * This endpoint is used to search multiple indexes at once.
 * It takes a query and a list of indexes to search in.
 * It will return the results from each index.
 * Example usage:
 * GET /api/search?query=oddput clementin&indexes=["members", "articles"]
 * This will search for "oddput clementin" in the "members" and "articles" indexes.
 */
export const GET: RequestHandler = async ({ url, locals }) => {
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
  let limit = Number.parseInt(url.searchParams.get("limit") ?? "20");
  if (limit === -1) {
    limit = 20;
  }
  const language = locals.language;

  const response = await meilisearch.multiSearch({
    queries: indexes.map((index) => ({
      indexUid: index,
      q: query,
      attributesToSearchOn: getSearchableAttributes(index, language),
      federationOptions: { weight: getFederatedWeight(index) },
      showRankingScoreDetails: true,
    })),
    federation: {},
  });

  const array: Hits = [];
  let i = 0;
  while (array.length < limit && i < response.hits.length) {
    const hit = response.hits[i];
    if (hit != null) {
      array.push(hit);
    }
    i++;
  }

  return new Response(JSON.stringify(array), {
    headers: {
      "Content-Type": "application/json",
    },
  });
};
