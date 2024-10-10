import type { PageServerLoad } from "./$types";
import { ShlinkApiClient } from "@shlinkio/shlink-js-sdk";
import { type ProblemDetailsError } from "@shlinkio/shlink-js-sdk/api-contract";
import { env } from "$env/dynamic/private";
import { NodeHttpClient } from "@shlinkio/shlink-js-sdk/node";
import { error, fail, type Actions, type NumericRange } from "@sveltejs/kit";
import { authorize } from "$lib/utils/authorization";
import apiNames from "$lib/utils/apiNames";
import { z } from "zod";
import { message, superValidate } from "sveltekit-superforms/server";
import { zod } from "sveltekit-superforms/adapters";

const VALID_ORDER = [
  "title",
  "dateCreated",
  "shortCode",
  "longUrl",
  "visits",
  "nonBotVisits",
] as const;

const VALID_DIR = ["ASC", "DESC"] as const;

const apiClient = new ShlinkApiClient(new NodeHttpClient(), {
  baseUrl: env.SHLINK_ENDPOINT,
  apiKey: env.SHLINK_API_KEY,
});

const createLinksSchema = z.object({
  url: z.string().min(1).url(),
  slug: z.string().min(1),
  tags: z.string().array().min(1, "You need to select at least one tag"),
});

const paramsSchema = z.object({
  page: z.coerce.number().default(1),
  orderBy: z.enum(VALID_ORDER).default("dateCreated"),
  dir: z.enum(VALID_DIR).default("DESC"),
  tags: z.string().array().default([]),
  search: z.string().optional(),
});

const getParams = (url: URL) => {
  const modifiedParams = Object.fromEntries(
    Array.from(url.searchParams.entries()).map(([key, value]) => [
      key,
      key === "tags" ? url.searchParams.getAll(key) : value
    ])
  )

  const { data: params, error: paramError } = paramsSchema.safeParse(
    modifiedParams
  );
  if (paramError) {
    throw error(422, paramError.errors.map((e) => e.message).join(". "));
  }
  return params;
};

const updateLinksSchema = createLinksSchema;

const deleteLinksSchema = z.object({
  deleting: z.string().array().min(1),
});

export const load: PageServerLoad = async ({ url, locals }) => {
  authorize(apiNames.ADMIN.SHLINK.READ, locals.user);

  const params = getParams(url);
  let domains;
  try {
    domains = await apiClient.listShortUrls({
      itemsPerPage: 20,
      page: params.page.toString(),
      orderBy: {
        field: params.orderBy,
        dir: params.dir,
      },
      tags: params.tags,
      searchTerm: params.search,
    });
  } catch (_e) {
    const e = _e as ProblemDetailsError;
    error(e.status as NumericRange<400, 599>, "Shlink error: " + e.title);
  }
  const tags = await apiClient.listTags();

  return {
    domains: domains.data,
    pagination: domains.pagination,
    tags: tags.data,
    createLinksForm: await superValidate(zod(createLinksSchema), {
      id: "create",
    }),
    updateLinksForm: await superValidate(zod(updateLinksSchema), {
      id: "update",
    }),
  };
};
export const actions: Actions = {
  create: async ({ locals, request }) => {
    authorize(apiNames.ADMIN.SHLINK.CREATE, locals.user);
    const createForm = await superValidate(request, zod(createLinksSchema));
    if (!createForm.valid) {
      return fail(400, { createForm });
    }
    try {
      await apiClient.createShortUrl({
        longUrl: createForm.data.url,
        customSlug: createForm.data.slug,
        tags: createForm.data.tags,
      });
    } catch (_e) {
      const e = _e as ProblemDetailsError;
      return message(
        createForm,
        {
          message: e.detail,
          type: "error",
        },
        { status: e.status as NumericRange<400, 599> },
      );
    }

    return message(createForm, {
      message: "Link successfully created",
      type: "success",
    });
  },
  update: async ({ locals, request }) => {
    authorize(apiNames.ADMIN.SHLINK.UPDATE, locals.user);
    const updateForm = await superValidate(request, zod(updateLinksSchema));
    if (!updateForm.valid) {
      return fail(400, { updateForm });
    }
    try {
      await apiClient.updateShortUrl(updateForm.data.slug, undefined, {
        longUrl: updateForm.data.url,
        tags: updateForm.data.tags,
      });
    } catch (_e) {
      const e = _e as ProblemDetailsError;
      return message(
        updateForm,
        {
          message: e.detail,
          type: "error",
        },
        { status: e.status as NumericRange<400, 599> },
      );
    }

    return message(updateForm, {
      message: "Link successfully updated",
      type: "success",
    });
  },
  delete: async ({ locals, request }) => {
    authorize(apiNames.ADMIN.SHLINK.DELETE, locals.user);
    const deleteForm = await superValidate(request, zod(deleteLinksSchema));
    if (!deleteForm.valid) {
      return fail(400, { deleteForm });
    }

    try {
      await Promise.all(
        deleteForm.data.deleting.map((t) => apiClient.deleteShortUrl(t)),
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
        deleteForm,
        {
          message: e.detail,
          type: "error",
        },
        { status: e.status as NumericRange<400, 599> },
      );
    }

    return message(deleteForm, {
      message: "Link(s) successfully removed",
      type: "success",
    });
  },
};
