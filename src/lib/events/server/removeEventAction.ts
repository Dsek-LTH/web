import apiNames from "$lib/utils/apiNames";
import { authorize } from "$lib/utils/authorization";
import { redirect } from "$lib/utils/redirect";
import * as m from "$paraglide/messages";
import { error, fail, type Action } from "@sveltejs/kit";
import { zod } from "sveltekit-superforms/adapters";
import { superValidate, type Infer } from "sveltekit-superforms/server";
import { z } from "zod";

export const removeEventSchema = z.object({
  removeAll: z.boolean().default(false),
});
export type RemoveEventSchema = Infer<typeof removeEventSchema>;

export const removeEventAction: Action<{ slug: string }> = async (event) => {
  const { request, locals, params } = event;
  const { prisma, user } = locals;

  const form = await superValidate(request, zod(removeEventSchema));
  if (!form.valid) return fail(400, { form });
  authorize(apiNames.EVENT.DELETE, user);

  const existingEvent = await prisma.event.findUnique({
    where: {
      slug: params.slug,
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
