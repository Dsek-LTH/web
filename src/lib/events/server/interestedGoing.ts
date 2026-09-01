import { interestedGoingSchema } from "$lib/events/schema";
import { fail, type Action } from "@sveltejs/kit";
import { zod4 } from "sveltekit-superforms/adapters";
import { message, superValidate } from "sveltekit-superforms/server";
import { api } from "$lib/api/client";

// The acting member is resolved server-side in Go from the (currently
// mocked) request identity - see $lib/api/client and ../../../DESIGN.md's
// Auth section. Notifying the event's organizer on going/interested isn't
// ported yet (see DESIGN.md's events section's "not ported this pass"
// list), so that side effect - present in the old Prisma version - is
// simply gone for now, not replicated client-side.
export const interestedAction =
  (isInterested: boolean, isGoing: boolean): Action =>
  async ({ request }) => {
    const form = await superValidate(request, zod4(interestedGoingSchema));
    if (!form.valid) return fail(400, { form });

    const status = isGoing ? "going" : isInterested ? "interested" : "none";
    await api.PATCH("/events/{slug}/attendance", {
      params: { path: { slug: form.data.slug } },
      body: { status },
    });

    return message(form, {
      message: `${
        isInterested
          ? "intresserad av"
          : isGoing
            ? "kommer på"
            : "kommer inte/är inte intresserad av"
      } event`,
      type: "hidden",
    });
  };
