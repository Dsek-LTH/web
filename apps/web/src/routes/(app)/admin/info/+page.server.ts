import { fail } from "@sveltejs/kit";
import { redirect } from "sveltekit-flash-message/server";
import { superValidate } from "sveltekit-superforms/server";
import { zod4 } from "sveltekit-superforms/adapters";
import { infoPageSchema } from "./schemas";
import type { Actions, PageServerLoad } from "./$types";
import * as m from "$paraglide/messages";
import { slugify } from "$lib/utils/slugify";
import { serverApi } from "$lib/server/apiClient";
import { requirePolicy } from "$lib/utils/access";
import apiNames from "$lib/utils/apiNames";

// markdown:create is enforced by the Go API itself - no authorize() call
// here. Calls the same unified POST /info-pages/{slug} endpoint
// info/[slug]/edit's create action uses, which also grants the creator a
// per-page edit policy.
export const load: PageServerLoad = async ({ locals }) => {
  requirePolicy(locals.user, apiNames.MARKDOWN.CREATE);
  return { form: await superValidate(zod4(infoPageSchema)) };
};

export const actions: Actions = {
  create: async (event) => {
    const { request } = event;
    const form = await superValidate(request, zod4(infoPageSchema));
    if (!form.valid) return fail(400, { form });
    const { name, markdownSv, markdownEn } = form.data;
    const slug = slugify(name);
    const created = await serverApi(event).POST("/info-pages/{slug}", {
      params: { path: { slug } },
      body: { markdownSv, markdownEn },
    });
    if (created.error) throw new Error("Failed to create info page");
    throw redirect(
      `/info/${slug}`,
      {
        message: `${m.admin_info_infoPageCreated()}`,
        type: "success",
      },
      event,
    );
  },
};
