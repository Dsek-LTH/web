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
import { getEvent } from "../events";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params, parent }) => {
  const event = await getEvent(params.slug);
  if (event == undefined) {
    throw error(404, {
      message: "Not found",
    });
  }
  const allTaggedMembers = await getAllTaggedMembers(event.comments);
  const { session } = await parent();
  const canEdit = await hasAccess(apiNames.EVENT.UPDATE, session?.user, {
    studentId: event.author.studentId,
  });
  return {
    event,
    allTaggedMembers,
    canEdit,
    commentForm: await superValidate(commentSchema),
    removeCommentForm: await superValidate(removeCommentSchema),
  };
};

export const actions = {
  comment: commentAction("EVENT"),
  removeComment: removeCommentAction("EVENT"),
};
