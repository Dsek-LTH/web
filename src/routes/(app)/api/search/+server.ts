import type { RequestHandler } from "@sveltejs/kit";
import { getMeilisearch } from "$lib/search/meilisearch";
import {
  getFederatedWeight,
  getSearchableAttributes,
} from "$lib/search/searchHelpers";
import {
  listOfAttributesUsedAsLink,
  type SearchDataWithType,
} from "$lib/search/searchTypes";
import { getLocale } from "$paraglide/runtime";

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

  // The "members" index holds member data (names, nickname, student ID, class,
  // photo) that the database access policies only expose to logged-in members.
  // Meilisearch is queried directly here, bypassing those policies, so without
  // this check an anonymous caller could read the whole member directory.
  const isLoggedInMember = locals.user.memberId != null;
  const permittedIndexes = isLoggedInMember
    ? indexes
    : indexes.filter((index) => index !== "members");

  // Anonymous caller asked only for member data, so there is nothing to return.
  if (permittedIndexes.length === 0) {
    return new Response(JSON.stringify([] satisfies SearchDataWithType[]), {
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  let limit = Number.parseInt(url.searchParams.get("limit") ?? "20");
  if (limit === -1) {
    limit = 20;
  }
  const language = getLocale();

  const offset = Number.parseInt(url.searchParams.get("offset") ?? "0");

  const response: SearchDataWithType[] = await getMeilisearch()
    .multiSearch({
      queries: permittedIndexes.map((index) => ({
        indexUid: index,
        q: query,
        attributesToSearchOn: getSearchableAttributes(index, language),
        federationOptions: { weight: getFederatedWeight(index) },
        showRankingScoreDetails: true,
      })),
      federation: {
        limit,
        offset,
      },
    })
    .then((response) => {
      return response.hits.map((hit) => {
        // Transform the data to hide that some
        // fields are language specific
        if (language === "en") {
          const hitCopy = { ...hit };
          const hitKeys = Object.keys(hit);
          for (const key of hitKeys) {
            if (key.endsWith("En")) {
              hitCopy[key.slice(0, -2)] = hit[key];
            }
          }
          hit = hitCopy;
        }

        // Reduce the amount of data sent to the client
        // all string values are truncated to 60 characters
        for (const key of Object.keys(hit)) {
          if (
            // We must not truncate attributes that are used as links
            !listOfAttributesUsedAsLink.includes(key) &&
            typeof hit[key] === "string"
          ) {
            hit[key] = hit[key].slice(0, 60);
          }
        }

        // The "articles" index embeds the author, whose nickname is member-only
        // data (same as the members index above). Strip it for anonymous callers.
        if (!isLoggedInMember) {
          const author = hit["author"];
          if (author && typeof author === "object") {
            delete (author as Record<string, unknown>)["nickname"];
          }
        }

        return {
          data: hit,
          type: hit._federation?.indexUid,
        } as SearchDataWithType;
      });
    });

  return new Response(JSON.stringify(response), {
    headers: {
      "Content-Type": "application/json",
    },
  });
};
