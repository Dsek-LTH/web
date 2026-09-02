import { getAllTaggedMembers } from "$lib/utils/commentTagging";
import { error } from "@sveltejs/kit";
import { serverApi } from "$lib/server/apiClient";
import type { PageServerLoad } from "./$types";
import * as m from "$paraglide/messages";

// Server-only load, not +page.ts - a documented exception (see DESIGN.md's
// "Principles going forward": "server-only load is a stopgap for routes
// that can't do that yet"). This page needs getAllTaggedMembers, which is
// a real Prisma lookup (@mention resolution, shared with articles - see
// DESIGN.md's API shape section) that depends on the event's comments,
// which only exist after fetching the event itself from Go - a universal
// +page.ts load has no way to sequence a Prisma call after a Go API call
// like that.
export const load: PageServerLoad = async (requestEvent) => {
  const { locals, params } = requestEvent;
  const { prisma } = locals;
  const res = await serverApi(requestEvent).GET("/events/{slug}", {
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
    // From Go (EventDetail.canEdit/canDelete), computed server-side from
    // the same checks Update/Delete themselves enforce - see the article
    // detail page's +page.ts and DESIGN.md's "Principles going forward" #5.
    canEdit: event.canEdit,
    canDelete: event.canDelete,
  };
};
