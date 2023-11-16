import { withAccess } from "$lib/utils/access";
import apiNames from "$lib/utils/apiNames";
import prisma from "$lib/utils/prisma";
import { fail, type RequestEvent } from "@sveltejs/kit";
import { message, superValidate } from "sveltekit-superforms/server";
import { z } from "zod";

export const likeSchema = z.object({
  articleId: z.string(),
});
export type LikeSchema = typeof likeSchema;

export const likesAction =
  (shouldLike: boolean) =>
  async ({ request, locals }: RequestEvent<Record<string, string>, string>) => {
    const form = await superValidate(request, likeSchema);
    if (!form.valid) return fail(400, { form });
    const session = await locals.getSession();
    return withAccess(
      apiNames.NEWS.LIKE,
      session?.user,
      async () => {
        await prisma.article.update({
          where: { id: form.data.articleId },
          data: {
            likers: {
              [shouldLike ? "connect" : "disconnect"]: {
                studentId: session?.user?.student_id,
              },
            },
          },
          select: {
            id: true,
          },
        });
        return message(form, {
          message: `${shouldLike ? "Gillat" : "Slutat gilla"} artikel`,
          type: "hidden",
        });
      },
      form
    );
  };
