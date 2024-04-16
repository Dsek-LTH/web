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
import type { Actions, PageServerLoad } from "./$types";
import { isAuthorized } from "$lib/utils/authorization";
import apiNames from "$lib/utils/apiNames";
import {
  removeEventAction,
  removeEventSchema,
} from "../../news/removeEventAction";

export const load: PageServerLoad = async ({ locals, params }) => {
  const { prisma, user } = locals;
  const event = await getEvent(prisma, params.slug);
  if (event == undefined) {
    throw error(404, {
      message: "Not found",
    });
  }
  const allTaggedMembers = await getAllTaggedMembers(prisma, event.comments);
  const canEdit = isAuthorized(apiNames.EVENT.UPDATE, user);
  const canDelete = isAuthorized(apiNames.EVENT.DELETE, user);
  return {
    event,
    allTaggedMembers,
    canEdit,
    canDelete,
    commentForm: await superValidate(commentSchema),
    removeCommentForm: await superValidate(removeCommentSchema),
    removeEventForm: await superValidate(removeEventSchema),
  };
};

export const actions: Actions = {
  comment: commentAction("EVENT"),
  removeComment: removeCommentAction("EVENT"),
  removeEvent: removeEventAction(),
};
