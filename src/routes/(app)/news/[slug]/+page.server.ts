import { getArticle } from "$lib/news/getArticles";
import apiNames from "$lib/utils/apiNames";
import { authorize, isAuthorized } from "$lib/utils/authorization";
import { getAllTaggedMembers } from "$lib/utils/commentTagging";
import { redirect } from "$lib/utils/redirect";
import {
  commentAction,
  commentSchema,
  removeCommentAction,
  removeCommentSchema,
} from "$lib/zod/comments";
import * as m from "$paraglide/messages";
import { error } from "@sveltejs/kit";
import { zod } from "sveltekit-superforms/adapters";
import { superValidate } from "sveltekit-superforms/server";
import { likeSchema, likesAction } from "../likes";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals, params }) => {
  const { prisma, user } = locals;
  const article = await getArticle(prisma, params.slug);
  if (article == undefined) {
    throw error(404, {
      message: m.news_errors_articleNotFound(),
    });
  }
  const allTaggedMembers = await getAllTaggedMembers(prisma, article.comments);
  const canEdit =
    isAuthorized(apiNames.NEWS.MANAGE, user) &&
    isAuthorized(apiNames.NEWS.UPDATE, user);
  const canDelete = isAuthorized(apiNames.NEWS.DELETE, user);
  return {
    article,
    allTaggedMembers,
    canEdit,
    canDelete,
    likeForm: await superValidate(zod(likeSchema)),
    commentForm: await superValidate(zod(commentSchema)),
    removeCommentForm: await superValidate(zod(removeCommentSchema)),
  };
};

export const actions: Actions = {
  like: likesAction(true),
  dislike: likesAction(false),
  comment: commentAction("NEWS"),
  removeComment: removeCommentAction("NEWS"),
  removeArticle: async (event) => {
    const { locals, params } = event;
    const { prisma, user } = locals;
    authorize(apiNames.NEWS.DELETE, user);

    const existingArticle = prisma.article.findUnique({
      where: {
        slug: params.slug,
      },
    });

    if (!existingArticle) return error(404, m.news_errors_articleNotFound());

    await prisma.article.update({
      where: {
        slug: params.slug,
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
  },
};
