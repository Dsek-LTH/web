import { fail, type Action } from "@sveltejs/kit";
import {
  message,
  superValidate,
  type Infer,
} from "sveltekit-superforms/server";
import { zod4 } from "sveltekit-superforms/adapters";
import * as messages from "$paraglide/messages";

import { z } from "zod";
import DOMPurify from "isomorphic-dompurify";

export const commentSchema = z.object({
  content: z.string().min(1),
});
export type CommentSchema = Infer<typeof commentSchema>;

export const removeCommentSchema = z.object({
  commentId: z.string(),
});
export type RemoveCommentSchema = Infer<typeof removeCommentSchema>;

export const commentAction =
  (entityType: "NEWS" | "EVENT"): Action =>
  async ({ locals, request, params }) => {
    const { prisma, user } = locals;
    const form = await superValidate(request, zod4(commentSchema));
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
            content: DOMPurify.sanitize(form.data.content),
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
        entityType satisfies never;
    }
    return message(form, {
      message: messages.comments_sent(),
      type: "hidden",
    });
  };

export const removeCommentAction =
  (entityType: "NEWS" | "EVENT"): Action =>
  async ({ locals, request, params }) => {
    const { prisma } = locals;
    const form = await superValidate(request, zod4(removeCommentSchema));
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
        entityType satisfies never;
    }
    return message(form, {
      message: messages.comments_removed(),
      type: "success",
    });
  };
