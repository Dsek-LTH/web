import type { PageServerLoad } from "./$types";
import { serverApi } from "$lib/server/apiClient";
import { error, fail, type Actions, type NumericRange } from "@sveltejs/kit";
import { z } from "zod";
import { message, superValidate } from "sveltekit-superforms/server";
import { zod4 } from "sveltekit-superforms/adapters";

// admin:shlink:read/create/update/delete (Go's apinames.AdminShlink*) are
// enforced by Go itself now (internal/links, a thin wrapper around Shlink's
// own REST API - see backend/CLAUDE.md's Admin routes section for why
// reads are proxied through as raw JSON rather than decoded into a
// hand-modeled shape) - no authorize() call here, matching DESIGN.md's
// Principle #5.

const VALID_ORDER = [
  "title",
  "dateCreated",
  "shortCode",
  "longUrl",
  "visits",
  "nonBotVisits",
] as const;

const VALID_DIR = ["ASC", "DESC"] as const;

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
  const { data: params, error: paramError } = paramsSchema.safeParse({
    ...Object.fromEntries(url.searchParams.entries()),
    tags: url.searchParams.getAll("tags"), // Allow multiple tags
  });
  if (paramError) {
    throw error(422, z.treeifyError(paramError).errors.join(". "));
  }
  return params;
};

const updateLinksSchema = createLinksSchema;

const deleteLinksSchema = z.object({
  deleting: z.string().array().min(1),
});

// Shlink's own response shapes, proxied through Go verbatim as `unknown` -
// see internal/links' package doc comment for why these aren't part of the
// generated openapi schema. Only the fields this page's load actually
// reads are declared.
type ShortUrlsList = {
  data: unknown[];
  pagination: unknown;
};
type TagsList = {
  data: unknown[];
};

export const load: PageServerLoad = async (event) => {
  const { url } = event;
  const api = serverApi(event);
  const params = getParams(url);

  const linksRes = await api.GET("/links", {
    params: {
      query: {
        page: params.page,
        orderBy: params.orderBy,
        dir: params.dir,
        tags: params.tags,
        search: params.search,
      },
    },
  });
  if (linksRes.error) {
    error(
      (linksRes.error.status ?? 500) as NumericRange<400, 599>,
      "Shlink error: " + (linksRes.error.detail ?? linksRes.error.title ?? ""),
    );
  }
  const domains = linksRes.data as ShortUrlsList;

  const tagsRes = await api.GET("/links/tags", {});
  const tags = (tagsRes.data as TagsList | undefined)?.data ?? [];

  return {
    domains: domains.data,
    pagination: domains.pagination,
    tags,
    createLinksForm: await superValidate(zod4(createLinksSchema), {
      id: "create",
    }),
    updateLinksForm: await superValidate(zod4(updateLinksSchema), {
      id: "update",
    }),
  };
};
export const actions: Actions = {
  create: async (event) => {
    const createForm = await superValidate(
      event.request,
      zod4(createLinksSchema),
    );
    if (!createForm.valid) {
      return fail(400, { createForm });
    }
    const res = await serverApi(event).POST("/links", {
      body: {
        url: createForm.data.url,
        slug: createForm.data.slug,
        tags: createForm.data.tags,
      },
    });
    if (res.error) {
      return message(
        createForm,
        { message: res.error.detail ?? res.error.title ?? "", type: "error" },
        { status: (res.error.status ?? 400) as NumericRange<400, 599> },
      );
    }

    return message(createForm, {
      message: "Link successfully created",
      type: "success",
    });
  },
  update: async (event) => {
    const updateForm = await superValidate(
      event.request,
      zod4(updateLinksSchema),
    );
    if (!updateForm.valid) {
      return fail(400, { updateForm });
    }
    const res = await serverApi(event).PATCH("/links/{shortCode}", {
      params: { path: { shortCode: updateForm.data.slug } },
      body: { url: updateForm.data.url, tags: updateForm.data.tags },
    });
    if (res.error) {
      return message(
        updateForm,
        { message: res.error.detail ?? res.error.title ?? "", type: "error" },
        { status: (res.error.status ?? 400) as NumericRange<400, 599> },
      );
    }

    return message(updateForm, {
      message: "Link successfully updated",
      type: "success",
    });
  },
  delete: async (event) => {
    const deleteForm = await superValidate(
      event.request,
      zod4(deleteLinksSchema),
    );
    if (!deleteForm.valid) {
      return fail(400, { deleteForm });
    }

    const res = await serverApi(event).DELETE("/links", {
      body: { shortCodes: deleteForm.data.deleting },
    });
    if (res.error) {
      return message(
        deleteForm,
        { message: res.error.detail ?? res.error.title ?? "", type: "error" },
        { status: (res.error.status ?? 400) as NumericRange<400, 599> },
      );
    }

    return message(deleteForm, {
      message: "Link(s) successfully removed",
      type: "success",
    });
  },
};
