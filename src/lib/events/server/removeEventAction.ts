import { redirect } from "sveltekit-flash-message/server";
import * as m from "$paraglide/messages";
import { error, fail, type Action } from "@sveltejs/kit";
import { zod4 } from "sveltekit-superforms/adapters";
import { superValidate, type Infer } from "sveltekit-superforms/server";
import { z } from "zod";
import { actionType } from "../schema";
import { api } from "$lib/api/client";

export const removeEventSchema = z.object({
  removeType: actionType,
});
export type RemoveEventSchema = Infer<typeof removeEventSchema>;

// No SvelteKit-side authorize() gate here - the Go API enforces this
// itself (apinames.EventDelete, currently via mock auth that always
// succeeds) - see backend/CLAUDE.md's Auth section. The old code's FUTURE
// branch never redirected (a bug - see DESIGN.md's events section); Go's
// Delete completes uniformly for every scope, so this redirects the same
// way for all three.
export const removeEventAction: Action<{ slug: string }> = async (event) => {
  const { request, params } = event;

  const form = await superValidate(request, zod4(removeEventSchema));
  if (!form.valid) return fail(400, { form });

  const res = await api.DELETE("/events/{slug}", {
    params: {
      path: { slug: params.slug },
      query: { scope: form.data.removeType },
    },
  });
  if (res.error) {
    if (res.response.status === 404) {
      return error(404, m.events_errors_eventNotFound());
    }
    return error(500, "Failed to delete event");
  }

  throw redirect(
    "/events",
    {
      message:
        form.data.removeType === "THIS"
          ? m.events_eventDeleted()
          : m.events_eventsDeleted(),
      type: "success",
    },
    event,
  );
};
