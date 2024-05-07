import type { PageServerLoad } from "./$types";
import {
  ShlinkApiClient,
  type HttpClient,
  type RequestOptions,
} from "@shlinkio/shlink-js-sdk";
import { SHLINK_ENDPOINT, SHLINK_API_KEY } from "$env/static/private";
import { NodeHttpClient } from "@shlinkio/shlink-js-sdk/node";
import { error } from "@sveltejs/kit";

export const load: PageServerLoad = async ({ locals, params, fetch, url }) => {
  const apiClient = new ShlinkApiClient(new NodeHttpClient(), {
    baseUrl: SHLINK_ENDPOINT,
    apiKey: SHLINK_API_KEY,
  });

  const page = url.searchParams.get("page") ?? "1";
  if (page && Number.isNaN(Number.parseInt(page))) {
    error(422, `Invalid page "${page}"`);
  }

  const domains = await apiClient.listShortUrls({
    itemsPerPage: 20,
    page: page,
  });
  const tags = await apiClient.listTags();

  return {
    domains: domains.data,
    pagination: domains.pagination,
    tags: tags.data,
  };
};
