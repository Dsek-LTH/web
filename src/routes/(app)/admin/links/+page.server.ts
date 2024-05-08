import type { PageServerLoad } from "./$types";
import { ShlinkApiClient } from "@shlinkio/shlink-js-sdk";
import { type ProblemDetailsError } from "@shlinkio/shlink-js-sdk/api-contract";
import { env } from "$env/dynamic/private";
import { NodeHttpClient } from "@shlinkio/shlink-js-sdk/node";
import { error, type NumericRange } from "@sveltejs/kit";

const VALID_ORDER = [
  "title",
  "dateCreated",
  "shortCode",
  "longUrl",
  "visits",
  "nonBotVisits",
];

const VALID_DIR = ["ASC", "DESC"];

export const load: PageServerLoad = async ({ url }) => {
  const apiClient = new ShlinkApiClient(new NodeHttpClient(), {
    baseUrl: env.SHLINK_ENDPOINT,
    apiKey: env.SHLINK_API_KEY,
  });

  const page = url.searchParams.get("page") ?? "1";
  if (page && Number.isNaN(Number.parseInt(page))) {
    error(422, `Invalid page "${page}"`);
  }

  const orderByField = url.searchParams.get("orderBy") ?? "dateCreated";
  if (!VALID_ORDER.some((v) => v === orderByField)) {
    error(422, "orderBy value not valid");
  }

  const dir = url.searchParams.get("dir") ?? "DESC";
  if (!VALID_DIR.some((v) => v === dir)) {
    error(422, "dir value not valid");
  }

  let domains;
  try {
    domains = await apiClient.listShortUrls({
      itemsPerPage: 20,
      page: page,
      orderBy: {
        field: orderByField as
          | "dateCreated"
          | "shortCode"
          | "longUrl"
          | "title"
          | "visits"
          | "nonBotVisits",
        dir: dir as "ASC" | "DESC",
      },
      tags: url.searchParams.getAll("tags"),
      searchTerm: url.searchParams.get("search") ?? undefined,
    });
  } catch (_e) {
    const e = _e as ProblemDetailsError;
    error(e.status as NumericRange<400, 599>, e.title);
  }
  const tags = await apiClient.listTags();

  return {
    domains: domains.data,
    pagination: domains.pagination,
    tags: tags.data,
  };
};
