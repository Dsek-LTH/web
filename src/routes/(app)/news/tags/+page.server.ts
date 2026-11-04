import { serverApi } from "$lib/server/apiClient";
import { fail } from "@sveltejs/kit";
import {
  message,
  superValidate,
  type Infer,
} from "sveltekit-superforms/server";
import { zod4 } from "sveltekit-superforms/adapters";
import { z } from "zod";
import type { Actions, PageServerLoad } from "./$types";
import * as m from "$paraglide/messages";

// tags:create/tags:update are enforced by Go (POST /tags, PUT /tags/{id}).
// Listing tags is public in Go; the page itself is only linked for
// tags:read holders (see news/+page.svelte).
export const load: PageServerLoad = async (event) => {
  const res = await serverApi(event).GET("/tags", {});
  return {
    tags: res.data ?? [],
    createForm: await superValidate(zod4(createSchema)),
    updateForm: await superValidate(zod4(updateSchema)),
  };
};

const createSchema = z.object({
  nameSv: z.string().default(""),
});
export type CreateSchema = Infer<typeof createSchema>;

const updateSchema = z.object({
  id: z.string().uuid(),
  nameSv: z.string().optional(),
  nameEn: z.string().nullable().optional(),
  color: z.string().optional(),
});
export type UpdateSchema = Infer<typeof updateSchema>;

export const actions: Actions = {
  create: async (event) => {
    const form = await superValidate(event.request, zod4(createSchema));
    if (!form.valid) return fail(400, { form });
    const res = await serverApi(event).POST("/tags", {
      body: { nameSv: form.data.nameSv },
    });
    if (res.error) {
      return message(
        form,
        {
          message: res.error.detail ?? m.news_errors_tagNotFound(),
          type: "error",
        },
        { status: 400 },
      );
    }
    return message(form, {
      message: m.news_tags_tagCreated(),
      type: "success",
    });
  },
  update: async (event) => {
    const form = await superValidate(event.request, zod4(updateSchema));
    if (!form.valid) return fail(400, { form });
    const { id, nameSv, nameEn, color } = form.data;
    const res = await serverApi(event).PUT("/tags/{id}", {
      params: { path: { id } },
      body: {
        nameSv: nameSv ?? "",
        nameEn: nameEn || undefined,
        color: color || undefined,
      },
    });
    if (res.error) {
      return message(
        form,
        { message: m.news_errors_tagNotFound(), type: "error" },
        { status: 400 },
      );
    }
    return message(form, {
      message: m.news_tags_tagUpdated(),
      type: "success",
    });
  },
};
