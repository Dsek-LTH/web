import { redirect } from "sveltekit-flash-message/server";
import { fail } from "@sveltejs/kit";
import { zod4 } from "sveltekit-superforms/adapters";
import { superValidate } from "sveltekit-superforms/server";
import { z } from "zod";
import type { Actions, PageServerLoad } from "./$types";
import { serverApi } from "$lib/server/apiClient";
import { requireCanEdit, requirePolicy } from "$lib/utils/access";
import apiNames from "$lib/utils/apiNames";

const markdownSchema = z.object({
  markdownSv: z.string(),
  markdownEn: z.string().nullable(),
});

// markdown:create/markdown:update (or this page's own dynamic grant) are
// enforced by the Go API itself (apps/api/internal/markdown) - no
// authorize() call here. create/update both go through the same Go
// endpoints admin/info's create form also uses.
export const load: PageServerLoad = async (event) => {
  const { params } = event;
  const res = await serverApi(event).GET("/info-pages/{slug}", {
    params: { path: { slug: params.slug } },
  });
  const page = res.data;
  // An existing page goes by Go's canEdit; a new one needs markdown:create.
  if (page) requireCanEdit(event.locals.user, page.canEdit);
  else requirePolicy(event.locals.user, apiNames.MARKDOWN.CREATE);

  return {
    form: await superValidate(
      {
        markdownSv: page?.markdownSv ?? "",
        markdownEn: page?.markdownEn ?? null,
      },
      zod4(markdownSchema),
    ),
    isCreating: page == undefined,
  };
};

export const actions: Actions = {
  create: async (event) => {
    const { request, params } = event;
    const form = await superValidate(request, zod4(markdownSchema));
    if (!form.valid) return fail(400, { form });
    const name = params.slug;
    const created = await serverApi(event).POST("/info-pages/{slug}", {
      params: { path: { slug: name } },
      body: {
        markdownSv: form.data.markdownSv,
        markdownEn: form.data.markdownEn ?? undefined,
      },
    });
    if (created.error) throw new Error("Failed to create page");
    throw redirect(
      `/info/${name}`,
      {
        message: `"${name}"-sida uppdaterad`,
        type: "success",
      },
      event,
    );
  },
  update: async (event) => {
    const { request, params } = event;
    const form = await superValidate(request, zod4(markdownSchema));
    if (!form.valid) return fail(400, { form });
    const name = params.slug;
    const updated = await serverApi(event).PUT("/info-pages/{slug}", {
      params: { path: { slug: name } },
      body: {
        markdownSv: form.data.markdownSv,
        markdownEn: form.data.markdownEn ?? undefined,
      },
    });
    if (updated.error) throw new Error("Failed to update page");
    throw redirect(
      `/info/${name}`,
      {
        message: `"${name}"-sida uppdaterad`,
        type: "success",
      },
      event,
    );
  },
};
