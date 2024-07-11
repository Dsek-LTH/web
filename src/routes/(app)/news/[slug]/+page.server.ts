import { getAllTaggedMembers } from "$lib/utils/commentTagging";
import {
  commentAction,
  commentSchema,
  removeCommentAction,
  removeCommentSchema,
} from "$lib/zod/comments";
import { error } from "@sveltejs/kit";
import { superValidate } from "sveltekit-superforms/server";
import { getArticle } from "../articles";
import { likeSchema, likesAction } from "../likes";
import type { Actions, PageServerLoad } from "./$types";
import { isAuthorized } from "$lib/utils/authorization";
import apiNames from "$lib/utils/apiNames";
import {
  removeArticleAction,
  removeArticleSchema,
} from "../removeArticleAction";
import * as m from "$paraglide/messages";

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
    likeForm: await superValidate(likeSchema),
    commentForm: await superValidate(commentSchema),
    removeCommentForm: await superValidate(removeCommentSchema),
    removeArticleForm: await superValidate(removeArticleSchema),
  };
};

export const actions: Actions = {
  like: likesAction(true),
  dislike: likesAction(false),
  comment: commentAction("NEWS"),
  removeComment: removeCommentAction("NEWS"),
  removeArticle: removeArticleAction(),
};
