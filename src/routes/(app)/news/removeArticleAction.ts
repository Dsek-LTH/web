import apiNames from "$lib/utils/apiNames";
import { authorize } from "$lib/utils/authorization";
import { error, fail, type RequestEvent } from "@sveltejs/kit";
import { redirect } from "$lib/utils/redirect";
import { superValidate } from "sveltekit-superforms/server";
import { z } from "zod";

export const removeArticleSchema = z.object({
  articleId: z.string(),
});
export type RemoveArticleSchema = typeof removeArticleSchema;

export const removeArticleAction =
  () => async (event: RequestEvent<Record<string, string>, string>) => {
    const { request, locals } = event;
    const { prisma, user } = locals;
    const form = await superValidate(request, removeArticleSchema);
    if (!form.valid) return fail(400, { form });
    authorize(apiNames.NEWS.DELETE, user);

    const existingArticle = prisma.article.findUnique({
      where: {
        id: form.data.articleId,
      },
    });

    if (!existingArticle) return error(404, "Article not found");

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
        message: "Artikel raderad",
        type: "success",
      },
      event,
    );
  };
