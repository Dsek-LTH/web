import { actionType, eventSchema } from "$lib/events/schema";
import { updateEvent } from "$lib/events/server/actions";
import apiNames from "$lib/utils/apiNames";
import { authorize } from "$lib/utils/authorization";
import * as m from "$paraglide/messages";
import { error } from "@sveltejs/kit";
import { zod } from "sveltekit-superforms/adapters";
import { superValidate } from "sveltekit-superforms/server";
import type { Actions, PageServerLoad } from "./$types";
import { getAllTags } from "$lib/news/tags";
import { z } from "zod";

export const load: PageServerLoad = async ({ locals, params }) => {
  const { prisma, user } = locals;

  const allTags = await getAllTags(prisma, true);
  const event = await prisma.event.findUnique({
    where: {
      slug: params.slug,
    },
    include: {
      tags: true,
    },
  });
  if (!event) {
    throw error(404, m.events_errors_eventNotFound());
  }
  if (event.authorId !== user.memberId) authorize(apiNames.EVENT.UPDATE, user);
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
    recurringEndDatetime: recurringEvent?.endDatetime,
    separationCount: recurringEvent?.separationCount,
  };
  return {
    allTags,
    event,
    recurringParentId: event?.recurringParentId,
    form: await superValidate(
      completeEvent,
      zod(eventSchema.and(z.object({ editType: actionType }))),
    ),
  };
};

export const actions: Actions = {
  default: updateEvent,
};
