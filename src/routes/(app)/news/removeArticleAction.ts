import apiNames from "$lib/utils/apiNames";
import { authorize } from "$lib/utils/authorization";
import { error, fail, type RequestEvent } from "@sveltejs/kit";
import { redirect } from "$lib/utils/redirect";
import { superValidate, type Infer } from "sveltekit-superforms/server";
import { zod } from "sveltekit-superforms/adapters";
import { z } from "zod";
import * as m from "$paraglide/messages";

export const removeArticleSchema = z.object({
  articleId: z.string(),
});
export type RemoveArticleSchema = Infer<typeof removeArticleSchema>;

export const removeArticleAction =
  () => async (event: RequestEvent<Record<string, string>, string>) => {
    const { request, locals } = event;
    const { prisma, user } = locals;
    const form = await superValidate(request, zod(removeArticleSchema));
    if (!form.valid) return fail(400, { form });
    authorize(apiNames.NEWS.DELETE, user);

    const existingArticle = prisma.article.findUnique({
      where: {
        id: form.data.articleId,
      },
    });

    if (!existingArticle) return error(404, m.news_errors_articleNotFound());

    await prisma.article.update({
      where: {
        id: form.data.articleId,
      },
      data: {
        removedAt: new Date(),
      },
    });

    throw redirect(
      "/news",
      {
        message: m.news_articleDeleted(),
        type: "success",
      },
      event,
    );
  };
