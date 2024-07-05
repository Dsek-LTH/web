import apiNames from "$lib/utils/apiNames";
import { authorize } from "$lib/utils/authorization";
import { error, fail, type RequestEvent } from "@sveltejs/kit";
import { redirect } from "$lib/utils/redirect";
import { superValidate } from "sveltekit-superforms/server";
import { z } from "zod";
import * as m from "$paraglide/messages";

export const removeEventSchema = z.object({
  eventId: z.string(),
  removeAll: z.boolean().default(false),
});
export type RemoveEventSchema = typeof removeEventSchema;

export const removeEventAction =
  () => async (event: RequestEvent<Record<string, string>, string>) => {
    const { request, locals } = event;
    const { prisma, user } = locals;

    const form = await superValidate(request, removeEventSchema);
    if (!form.valid) return fail(400, { form });
    authorize(apiNames.EVENT.DELETE, user);

    const existingEvent = await prisma.event.findUnique({
      where: {
        id: form.data.eventId,
      },
    });

    if (!existingEvent) return error(404, m.events_errors_eventNotFound());

    if (form.data.removeAll) {
      await prisma.event.updateMany({
        where: {
          recurringParentId: existingEvent.recurringParentId,
        },
        data: {
          removedAt: new Date(),
        },
      });
      throw redirect(
        "/events",
        {
          message: m.events_eventsDeleted(),
          type: "success",
        },
        event,
      );
    } else {
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
          message: m.events_eventDeleted(),
          type: "success",
        },
        event,
      );
    }
  };
