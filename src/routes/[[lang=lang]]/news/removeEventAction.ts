import { withAccess } from "$lib/utils/access";
import apiNames from "$lib/utils/apiNames";
import prisma from "$lib/utils/prisma";
import { error, fail, type RequestEvent } from "@sveltejs/kit";
import { redirect } from "sveltekit-flash-message/server";
import { superValidate } from "sveltekit-superforms/server";
import { z } from "zod";

export const removeEventSchema = z.object({
  eventId: z.string(),
});
export type RemoveEventSchema = typeof removeEventSchema;

export const removeEventAction =
  () => async (event: RequestEvent<Record<string, string>, string>) => {
    const { request, locals } = event;
    const form = await superValidate(request, removeEventSchema);
    if (!form.valid) return fail(400, { form });
    const session = await locals.getSession();
    return withAccess(
      apiNames.EVENT.DELETE,
      session?.user,
      async () => {
        const existingEvent = await prisma.event.findUnique({
          where: {
            id: form.data.eventId,
          },
        });

        if (!existingEvent) return error(404, "Event not found");

        await prisma.event.update({
          where: {
            id: existingEvent.id,
          },
          data: {
            removedAt: new Date(),
          },
        });

        throw redirect(
          "/events",
          {
            message: "Event raderat",
            type: "success",
          },
          event,
        );
      },
      form,
    );
  };
