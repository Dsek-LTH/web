import apiNames from "$lib/utils/apiNames";
import { error, fail } from "@sveltejs/kit";
import { redirect } from "$lib/utils/redirect";
import { superValidate } from "sveltekit-superforms/server";
import { eventSchema } from "../../schema";
import type { Actions, PageServerLoad } from "./$types";
import { validate as uuidValidate } from "uuid";
import { authorize } from "$lib/utils/authorization";
import * as m from "$paraglide/messages";

export const load: PageServerLoad = async ({ locals, params }) => {
  const { prisma, user } = locals;
  authorize(apiNames.EVENT.UPDATE, user);

  const allTags = await prisma.tag.findMany();
  const event = await prisma.event.findUnique({
    where: uuidValidate(params.slug)
      ? {
          id: params.slug,
        }
      : {
          slug: params.slug,
        },
  });
  if (!event) {
    throw error(404, m.events_errors_eventNotFound());
  }
  const isRecurring = event.recurringParentId !== null;
  const recurringEvent = isRecurring
    ? await prisma.recurringEvent.findUnique({
        where: {
          id: event.recurringParentId ?? "",
        },
      })
    : null;
  if (isRecurring && !recurringEvent) {
    error(500, m.events_errors_recurringParentNotFound());
  }
  const completeEvent = {
    ...event,
    isRecurring: isRecurring,
    recurringType: recurringEvent?.recurringType,
    recurringEndDateTime: recurringEvent?.endDatetime,
    separationCount: recurringEvent?.separationCount,
  };
  return {
    allTags,
    event,
    form: await superValidate(completeEvent, eventSchema),
  };
};

export const actions: Actions = {
  default: async (event) => {
    const { request, locals, params } = event;
    const { prisma } = locals;
    const form = await superValidate(request, eventSchema);
    if (!form.valid) return fail(400, { form });
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars --
     * To avoid lint complaining about unused vars
     **/
    const { isRecurring, recurringEndDatetime, ...recurringEventData } =
      form.data;

    /* eslint-disable-next-line @typescript-eslint/no-unused-vars --
     * To avoid lint complaining about unused vars
     **/
    const { recurringType, separationCount, tags, ...eventData } =
      recurringEventData;
    const existingEvent = await prisma.event.findUnique({
      where: uuidValidate(params.slug)
        ? {
            id: params.slug,
          }
        : {
            slug: params.slug,
          },
      select: { id: true },
    });
    if (!existingEvent) {
      throw error(404, m.events_errors_eventNotFound());
    }
    await prisma.event.update({
      where: {
        id: existingEvent.id,
      },
      data: {
        ...eventData,
        author: undefined,
        tags: {
          connect: form.data.tags
            .filter((tag) => !!tag)
            .map((tag) => ({
              id: tag.id,
            })),
        },
      },
    });

    throw redirect(
      `/events/${params.slug}`,
      {
        message: m.events_eventUpdated(),
        type: "success",
      },
      event,
    );
  },
};
