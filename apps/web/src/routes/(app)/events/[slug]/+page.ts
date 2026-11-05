import { api } from "$lib/api/client";
import { commentSchema, removeCommentSchema } from "$lib/zod/comments";
import * as m from "$paraglide/messages";
import { error } from "@sveltejs/kit";
import { zod4 } from "sveltekit-superforms/adapters";
import { superValidate } from "sveltekit-superforms";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ fetch, params }) => {
  const res = await api.GET("/events/{slug}", {
    fetch,
    params: { path: { slug: params.slug } },
  });
  if (res.error) {
    error(404, { message: m.events_errors_eventNotFound() });
  }
  const event = res.data;

  return {
    event,
    // Members @mentioned in the comments, resolved by Go so mentions show
    // each member's current name (see replaceCommentTags).
    allTaggedMembers: event.taggedMembers ?? [],
    // From Go (EventDetail.canEdit/canDelete), computed server-side from
    // the same checks Update/Delete themselves enforce - see the article
    // detail page's +page.ts.
    canEdit: event.canEdit,
    canDelete: event.canDelete,
    commentForm: await superValidate(zod4(commentSchema)),
    removeCommentForm: await superValidate(zod4(removeCommentSchema)),
  };
};
