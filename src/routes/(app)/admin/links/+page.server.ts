import type { PageServerLoad } from "./$types";
import { ShlinkApiClient } from "@shlinkio/shlink-js-sdk";
import { type ProblemDetailsError } from "@shlinkio/shlink-js-sdk/api-contract";
import { env } from "$env/dynamic/private";
import { NodeHttpClient } from "@shlinkio/shlink-js-sdk/node";
import { error, type Actions, type NumericRange } from "@sveltejs/kit";
import { authorize } from "$lib/utils/authorization";
import apiNames from "$lib/utils/apiNames";
import { z } from "zod";
import { message, superValidate } from "sveltekit-superforms/server";

const VALID_ORDER = [
  "title",
  "dateCreated",
  "shortCode",
  "longUrl",
  "visits",
  "nonBotVisits",
];

const VALID_DIR = ["ASC", "DESC"];

const apiClient: ShlinkApiClient = new ShlinkApiClient(new NodeHttpClient(), {
  baseUrl: env.SHLINK_ENDPOINT,
  apiKey: env.SHLINK_API_KEY,
});

const createLinksSchema = z.object({
  url: z.string().min(1).url(),
  slug: z.string().min(1),
  tags: z.string().array().min(1, "You need to select at least one tag"),
});

const deleteLinksSchema = z.object({
  deleting: z.string().array().min(1),
});

export const load: PageServerLoad = async ({ url, locals, request }) => {
  authorize(apiNames.DOOR.READ, locals.user);

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
    createLinksForm: await superValidate(request, createLinksSchema),
  };
};
export const actions: Actions = {
  create: async ({ locals, request }) => {
    authorize(apiNames.DOOR.CREATE, locals.user);
    const form = await superValidate(request, createLinksSchema);
    if (!form.valid) {
      return message(
        form,
        {
          message: "Request is not valid",
          type: "error",
        },
        { status: 400 },
      );
    }
    try {
      await apiClient.createShortUrl({
        longUrl: form.data.url,
        customSlug: form.data.slug,
        tags: form.data.tags,
      });
    } catch (_e) {
      const e = _e as ProblemDetailsError;
      return message(
        form,
        {
          message: e.detail,
          type: "error",
        },
        { status: e.status as NumericRange<400, 599> },
      );
    }

    return message(form, {
      message: "Link successfully created",
      type: "success",
    });
  },
  delete: async ({ locals, request }) => {
    authorize(apiNames.DOOR.DELETE, locals.user);
    const form = await superValidate(request, deleteLinksSchema);
    if (!form.valid) {
      return message(
        form,
        {
          message: "Request is not valid",
          type: "error",
        },
        { status: 400 },
      );
    }

    try {
      await Promise.all(
        form.data.deleting.map((t) => apiClient.deleteShortUrl(t)),
      );

      // Delete tags without any links
      await apiClient.deleteTags(
        (await apiClient.tagsStats()).data
          .filter((t) => t.shortUrlsCount === 0)
          .map((t) => t.tag),
      );
    } catch (_e) {
      const e = _e as ProblemDetailsError;
      return message(
        form,
        {
          message: e.detail,
          type: "error",
        },
        { status: e.status as NumericRange<400, 599> },
      );
    }

    return message(form, {
      message: "Link(s) successfully removed",
      type: "success",
    });
  },
};
