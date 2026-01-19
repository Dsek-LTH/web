import { getAllTaggedMembers } from "$lib/utils/commentTagging";
import {
  commentAction,
  commentSchema,
  removeCommentAction,
  removeCommentSchema,
} from "$lib/zod/comments";
import { error } from "@sveltejs/kit";
import { superValidate } from "sveltekit-superforms/server";
import { zod4 } from "sveltekit-superforms/adapters";
import { getEvent } from "$lib/events/getEvents";
import type { Actions, PageServerLoad } from "./$types";
import { isAuthorized } from "$lib/utils/authorization";
import apiNames from "$lib/utils/apiNames";
import {
  removeEventAction,
  removeEventSchema,
} from "$lib/events/server/removeEventAction";
import * as m from "$paraglide/messages";
import { interestedGoingSchema } from "$lib/events/schema";

export const load: PageServerLoad = async ({ locals, params }) => {
  const { prisma, user } = locals;
  const event = await getEvent(prisma, params.slug);
  if (event == undefined) {
    throw error(404, {
      message: m.events_errors_eventNotFound(),
    });
  }
  const allTaggedMembers = await getAllTaggedMembers(prisma, event.comments);
  const canEdit =
    isAuthorized(apiNames.EVENT.UPDATE, user) ||
    event.authorId === user.memberId;
  const canDelete = isAuthorized(apiNames.EVENT.DELETE, user);
  return {
    event,
    allTaggedMembers,
    canEdit,
    canDelete,
    commentForm: await superValidate(zod4(commentSchema)),
    removeCommentForm: await superValidate(zod4(removeCommentSchema)),
    removeEventForm: await superValidate(zod4(removeEventSchema)),
    interestedGoingForm: await superValidate(zod4(interestedGoingSchema)),
  };
};

export const actions: Actions = {
  comment: commentAction("EVENT"),
  removeComment: removeCommentAction("EVENT"),
  removeEvent: removeEventAction,
};
