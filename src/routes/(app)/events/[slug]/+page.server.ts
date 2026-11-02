import { actionType } from "$lib/events/schema";
import { serverApi } from "$lib/server/apiClient";
import { commentAction, removeCommentAction } from "$lib/server/comments";
import * as m from "$paraglide/messages";
import { error, fail, type Action } from "@sveltejs/kit";
import { z } from "zod";
import { redirect } from "sveltekit-flash-message/server";
import { zod4 } from "sveltekit-superforms/adapters";
import { superValidate } from "sveltekit-superforms/server";
import type { Actions } from "./$types";

// The load is universal (+page.ts); these are the page's form actions, all
// thin proxies to Go - attendance, comments and delete are each enforced
// there, not here.

const removeEventSchema = z.object({ removeType: actionType.default("THIS") });

const attendanceAction =
  (status: "going" | "interested" | "none"): Action<{ slug: string }> =>
  async (event) => {
    // The event comes from the URL; InterestedGoingButtons' hidden eventId
    // field isn't needed.
    const res = await serverApi(event).PATCH("/events/{slug}/attendance", {
      params: { path: { slug: event.params.slug } },
      body: { status },
    });
    if (res.error) {
      error(res.response.status === 404 ? 404 : 400, {
        message: m.events_errors_eventNotFound(),
      });
    }
  };

export const actions: Actions = {
  going: attendanceAction("going"),
  interested: attendanceAction("interested"),
  none: attendanceAction("none"),
  comment: commentAction("EVENT"),
  removeComment: removeCommentAction("EVENT"),
  removeEvent: async (event) => {
    const form = await superValidate(event.request, zod4(removeEventSchema));
    if (!form.valid) return fail(400, { form });
    // Go itself only removes more than this one event for a recurring
    // series, so a stray FUTURE/ALL on a single event can't do damage.
    const scope = form.data.removeType;
    const res = await serverApi(event).DELETE("/events/{slug}", {
      params: { path: { slug: event.params.slug }, query: { scope } },
    });
    if (res.error) {
      error(res.response.status === 404 ? 404 : 403, {
        message: m.events_errors_eventNotFound(),
      });
    }
    redirect(
      "/events",
      {
        message:
          scope === "THIS" ? m.events_eventDeleted() : m.events_eventsDeleted(),
        type: "success",
      },
      event,
    );
  },
};
