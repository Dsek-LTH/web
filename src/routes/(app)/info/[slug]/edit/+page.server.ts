import { redirect } from "sveltekit-flash-message/server";
import { fail } from "@sveltejs/kit";
import { zod4 } from "sveltekit-superforms/adapters";
import { superValidate } from "sveltekit-superforms/server";
import { z } from "zod";
import type { Actions, PageServerLoad } from "./$types";
import { api } from "$lib/api/client";

const markdownSchema = z.object({
  markdownSv: z.string(),
  markdownEn: z.string().nullable(),
});

// markdown:create/markdown:update (or this page's own dynamic grant) are
// enforced by the Go API itself (backend/internal/markdown) - no
// authorize() call here, matching DESIGN.md's Principle #5. create/update
// both now go through the same unified Go endpoints admin/info's create
// form also uses - see backend/CLAUDE.md's Markdown routes section for the
// policy-naming unification this replaced.
export const load: PageServerLoad = async ({ fetch, params }) => {
  const res = await api.GET("/info/{slug}", {
    fetch,
    params: { path: { slug: params.slug } },
  });
  const page = res.data;

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
    const created = await api.POST("/info/{slug}", {
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
    const updated = await api.PATCH("/info/{slug}", {
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
