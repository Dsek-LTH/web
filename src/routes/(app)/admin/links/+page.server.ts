import type { PageServerLoad } from "./$types";
import { ShlinkApiClient } from "@shlinkio/shlink-js-sdk";
import { type ProblemDetailsError } from "@shlinkio/shlink-js-sdk/api-contract";
import { env } from "$env/dynamic/private";
import { NodeHttpClient } from "@shlinkio/shlink-js-sdk/node";
import { error, type Actions, type NumericRange } from "@sveltejs/kit";
import { authorize } from "$lib/utils/authorization"
import apiNames from "$lib/utils/apiNames"
import { z } from "zod"
import { message, superValidate } from "sveltekit-superforms/server"

const VALID_ORDER = [
  "title",
  "dateCreated",
  "shortCode",
  "longUrl",
  "visits",
  "nonBotVisits",
];

const VALID_DIR = ["ASC", "DESC"];

export const load: PageServerLoad = async ({ url, locals }) => {
  authorize(apiNames.DOOR.READ, locals.user);
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

const deleteLinksSchema = z.object({
  deleting: z.string().array().min(1),
});

export const actions: Actions = {
  delete: async ({ locals, request }) => {
    authorize(apiNames.DOOR.DELETE, locals.user);
    const form = await superValidate(request, deleteLinksSchema);
    if (!form.valid) {
      return message(form, {
        message: "Request is not valid",
        type: "error",
      }, {status: 400});
    }
    console.log(`deleting`)
    console.log(form)
  }
}
