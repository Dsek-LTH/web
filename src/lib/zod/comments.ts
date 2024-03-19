import { fail, type RequestEvent } from "@sveltejs/kit";
import { message, superValidate } from "sveltekit-superforms/server";
import { z } from "zod";

export const commentSchema = z.object({
  content: z.string().min(1),
});
export type CommentSchema = typeof commentSchema;

export const removeCommentSchema = z.object({
  commentId: z.string(),
});
export type RemoveCommentSchema = typeof removeCommentSchema;

export const commentAction =
  (entityType: "NEWS" | "EVENT") =>
  async ({
    locals,
    request,
    params,
  }: RequestEvent<Record<string, string>, string>) => {
    const { prisma, user } = locals;
    const form = await superValidate(request, commentSchema);
    if (!form.valid) return fail(400, { form });
    const args = {
      where: { slug: params["slug"] },
      data: {
        comments: {
          create: {
            member: {
              connect: {
                studentId: user?.studentId,
              },
            },
            content: form.data.content,
            published: new Date(),
          },
        },
      },
    };
    // I tried just changing the "prisma.article" part into something like "prisma[entityType === ...]" but it doesn't work so instead I did this
    switch (entityType) {
      case "NEWS":
        await prisma.article.update(args);
        break;
      case "EVENT":
        await prisma.event.update(args);
        break;
      default:
        return message(
          form,
          {
            message: 'Kommentar skickades inte. "Invalid comment entity type"',
            type: "error",
          },
          {
            status: 400,
          },
        );
    }
    return message(form, {
      message: "Kommentar skickad",
      type: "hidden",
    });
  };

export const removeCommentAction =
  (entityType: "NEWS" | "EVENT") =>
  async ({
    locals,
    request,
    params,
  }: RequestEvent<Record<string, string>, string>) => {
    const { prisma } = locals;
    const form = await superValidate(request, removeCommentSchema);
    if (!form.valid) return fail(400, { form });
    const args = {
      where: { slug: params["slug"] },
      data: {
        comments: {
          delete: {
            id: form.data.commentId,
          },
        },
      },
    };
    switch (entityType) {
      case "NEWS":
        await prisma.article.update(args);
        break;
      case "EVENT":
        await prisma.event.update(args);
        break;
      default:
        return message(
          form,
          {
            message:
              'Kommentar kunde inte tas bort. "Invalid comment entity type"',
            type: "error",
          },
          {
            status: 400,
          },
        );
    }
    return message(form, {
      message: "Kommentar borttagen",
      type: "success",
    });
  };
