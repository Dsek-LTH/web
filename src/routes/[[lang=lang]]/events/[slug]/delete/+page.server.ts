import { withAccess } from "$lib/utils/access";
import apiNames from "$lib/utils/apiNames";
import prisma from "$lib/utils/prisma";
import { error, fail } from "@sveltejs/kit";
import { redirect } from "sveltekit-flash-message/server";
import { superValidate } from "sveltekit-superforms/server";
import { eventSchema } from "../../schema";
import type { Actions } from "./$types";
import { isUUIDRegex } from "$lib/utils/generateUUID";

export const actions: Actions = {
  default: async (event) => {
    const { request, locals, params } = event;
    const form = await superValidate(request, eventSchema);
    if (!form.valid) return fail(400, { form });
    const session = await locals.getSession();
    return withAccess(
      apiNames.EVENT.DELETE,
      session?.user,
      async () => {
        const existingEvent = await prisma.event.findUnique({
          where: isUUIDRegex.test(params.slug)
            ? {
                id: params.slug,
              }
            : {
                slug: params.slug,
              },
          select: { id: true },
        });
        if (!existingEvent) {
          throw error(404, "Event not found");
        }
        await prisma.event.update({
          where: {
            id: existingEvent.id,
          },
          data: {
            removedAt: new Date(),
          },
        });

        throw redirect(
          `/events`,
          {
            message: "Evenemang raderat",
            type: "success",
          },
          event,
        );
      },
      form,
    );
  },
};
