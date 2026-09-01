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
import { api } from "$lib/api/client";
import type { Actions, PageServerLoad } from "./$types";
import {
  removeEventAction,
  removeEventSchema,
} from "$lib/events/server/removeEventAction";
import * as m from "$paraglide/messages";
import { interestedGoingSchema } from "$lib/events/schema";

// Server-only load, not +page.ts - a documented exception (see DESIGN.md's
// "Principles going forward": "server-only load is a stopgap for routes
// that can't do that yet"). This page needs getAllTaggedMembers, which is
// a real Prisma lookup (@mention resolution, shared with articles - see
// DESIGN.md's API shape section) that depends on the event's comments,
// which only exist after fetching the event itself from Go - a universal
// +page.ts load has no way to sequence a Prisma call after a Go API call
// like that.
export const load: PageServerLoad = async ({ fetch, locals, params }) => {
  const { prisma } = locals;
  const res = await api.GET("/events/{slug}", {
    fetch,
    params: { path: { slug: params.slug } },
  });
  if (res.error) {
    throw error(404, { message: m.events_errors_eventNotFound() });
  }
  const event = res.data;
  const allTaggedMembers = await getAllTaggedMembers(
    prisma,
    (event.comments ?? []).map((c) => ({ content: c.content ?? null })),
  );

  return {
    event,
    allTaggedMembers,
    // Go's auth.Require is the only real gate and it's currently the
    // all-permissions mock, so approximating a signal for a check that
    // always passes anyway is pointless - same reasoning as the article
    // detail page's canEdit/canDelete (see DESIGN.md's Auth section).
    canEdit: true,
    canDelete: true,
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
