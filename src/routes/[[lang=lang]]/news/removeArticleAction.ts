import { withAccess } from "$lib/utils/access";
import apiNames from "$lib/utils/apiNames";
import prisma from "$lib/utils/prisma";
import { error, fail, type RequestEvent } from "@sveltejs/kit";
import { redirect } from "sveltekit-flash-message/server";
import { superValidate } from "sveltekit-superforms/server";
import { z } from "zod";

export const removeArticleSchema = z.object({
  articleId: z.string(),
});
export type RemoveArticleSchema = typeof removeArticleSchema;

export const removeArticleAction =
  () => async (event: RequestEvent<Record<string, string>, string>) => {
    const { request, locals } = event;
    const form = await superValidate(request, removeArticleSchema);
    if (!form.valid) return fail(400, { form });
    const session = await locals.getSession();
    return withAccess(
      apiNames.NEWS.DELETE,
      session?.user,
      async () => {
        const existingArticle = await prisma.article.findUnique({
          where: {
            id: form.data.articleId,
          },
        });

        if (!existingArticle) return error(404, "Article not found");

        await prisma.article.update({
          where: {
            id: existingArticle.id,
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
      },
      form,
    );
  };
