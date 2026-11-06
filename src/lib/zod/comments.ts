import { error, fail, type Action } from "@sveltejs/kit";
import {
  message,
  superValidate,
  type Infer,
} from "sveltekit-superforms/server";
import { zod4 } from "sveltekit-superforms/adapters";

import { z } from "zod";
import DOMPurify from "isomorphic-dompurify";
import * as m from "$paraglide/messages";
import authorizedPrismaClient from "$lib/server/authorizedPrisma";
import type { ExtendedPrisma } from "$lib/server/extendedPrisma";
import apiNames from "$lib/utils/apiNames";
import { isAuthorized } from "$lib/utils/authorization";

export const commentSchema = z.object({
  content: z.string().trim().min(1).max(255),
  /** Set when replying: the comment (or reply) being answered. */
  parentId: z.guid().optional(),
});
export type CommentSchema = Infer<typeof commentSchema>;

export const removeCommentSchema = z.object({
  commentId: z.string(),
});
export type RemoveCommentSchema = Infer<typeof removeCommentSchema>;

type EntityType = "NEWS" | "EVENT";

type CommentRow = {
  id: string;
  memberId: string;
  content: string | null;
  _count: { replies: number };
};

const commentSelect = {
  id: true,
  memberId: true,
  content: true,
  _count: { select: { replies: true } },
} as const;

/**
 * The comment queries differ between articles and events only in the model and the
 * relation to the parent entity. Prisma's delegates can't be used through a union, so
 * each entity gets its own small implementation.
 */
const commentStore = (prisma: ExtendedPrisma, entityType: EntityType) => {
  switch (entityType) {
    case "NEWS":
      return {
        /** Looks a comment up through the access-policy client, scoped to the article. */
        find: (id: string, slug: string): Promise<CommentRow | null> =>
          prisma.articleComment.findFirst({
            where: { id, article: { slug } },
            select: commentSelect,
          }),
        // Writes run after our own permission check (see removeCommentAction), without
        // the policy client: the soft delete is an update, which the policies don't allow.
        markRemoved: (id: string) =>
          authorizedPrismaClient.articleComment.update({
            where: { id },
            data: { content: null },
          }),
        deleteUnrestricted: (id: string) =>
          authorizedPrismaClient.articleComment.delete({ where: { id } }),
      };
    case "EVENT":
      return {
        find: (id: string, slug: string): Promise<CommentRow | null> =>
          prisma.eventComment.findFirst({
            where: { id, event: { slug } },
            select: commentSelect,
          }),
        markRemoved: (id: string) =>
          authorizedPrismaClient.eventComment.update({
            where: { id },
            data: { content: null },
          }),
        deleteUnrestricted: (id: string) =>
          authorizedPrismaClient.eventComment.delete({ where: { id } }),
      };
  }
};

export const commentAction =
  (entityType: EntityType): Action =>
  async ({ locals, request, params }) => {
    const { prisma, user } = locals;
    const form = await superValidate(request, zod4(commentSchema));
    if (!form.valid) return fail(400, { form });
    const slug = params["slug"] ?? "";

    let parentId: string | undefined;
    if (form.data.parentId) {
      const parent = await commentStore(prisma, entityType).find(
        form.data.parentId,
        slug,
      );
      // A removed comment has no Reply button; refuse hand-made requests too.
      if (!parent || parent.content === null) {
        return message(
          form,
          { message: m.comments_errors_parentNotFound(), type: "error" },
          { status: 400 },
        );
      }
      parentId = parent.id;
    }

    const args = {
      where: { slug },
      data: {
        comments: {
          create: {
            member: {
              connect: {
                studentId: user?.studentId,
              },
            },
            ...(parentId && { parent: { connect: { id: parentId } } }),
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
        return message(
          form,
          {
            message: m.comments_errors_invalidEntity(),
            type: "error",
          },
          {
            status: 400,
          },
        );
    }
    return message(form, {
      message: m.comments_posted(),
      type: "success",
    });
  };

export const removeCommentAction =
  (entityType: EntityType): Action =>
  async ({ locals, request, params }) => {
    const { prisma, user } = locals;
    const form = await superValidate(request, zod4(removeCommentSchema));
    if (!form.valid) return fail(400, { form });
    const store = commentStore(prisma, entityType);

    const comment = await store.find(form.data.commentId, params["slug"] ?? "");
    if (!comment || comment.content === null) {
      throw error(404, m.comments_errors_notFound());
    }
    // Mirrors the delete policies on ArticleComment/EventComment in schema.zmodel, which
    // can't guard the soft delete below since that is an update. Keep the two in sync.
    const canDelete =
      isAuthorized(apiNames[entityType].COMMENT_DELETE, user) ||
      comment.memberId === user?.memberId;
    if (!canDelete) throw error(403, m.comments_errors_notAllowed());

    if (comment._count.replies > 0) {
      // Keep the thread: other members' replies would otherwise disappear with it.
      await store.markRemoved(comment.id);
    } else {
      // A placeholder parent left without replies stays in the database, but
      // buildCommentTree no longer shows it.
      await store.deleteUnrestricted(comment.id);
    }

    return message(form, {
      message: m.comments_removed(),
      type: "success",
    });
  };
