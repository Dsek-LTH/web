import { hasAccess } from "$lib/utils/access";
import apiNames from "$lib/utils/apiNames";
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

export const load: PageServerLoad = async ({ params, parent }) => {
  const article = await getArticle(params.slug);
  if (article == undefined) {
    throw error(404, {
      message: "Not found",
    });
  }
  const allTaggedMembers = await getAllTaggedMembers(article.comments);
  const { session } = await parent();
  const canEdit = await hasAccess(
    [apiNames.NEWS.UPDATE, apiNames.NEWS.MANAGE],
    session?.user,
    {
      studentId: article.author.member.studentId,
    },
  );
  return {
    article,
    allTaggedMembers,
    canEdit,
    likeForm: await superValidate(likeSchema),
    commentForm: await superValidate(commentSchema),
    removeCommentForm: await superValidate(removeCommentSchema),
  };
};

export const actions: Actions = {
  like: likesAction(true),
  dislike: likesAction(false),
  comment: commentAction("NEWS"),
  removeComment: removeCommentAction("NEWS"),
};
