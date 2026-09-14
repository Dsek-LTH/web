import { actionType, eventSchema } from "$lib/events/schema";
import { createEvent } from "$lib/events/server/actions";
import { error } from "@sveltejs/kit";
import { zod4 } from "sveltekit-superforms/adapters";
import { superValidate } from "sveltekit-superforms/server";
import type { Actions, PageServerLoad } from "./$types";
import { getAllTags } from "$lib/news/tags";
import { z } from "zod";
import * as messages from "$paraglide/messages";

export const load: PageServerLoad = async ({ locals }) => {
  const { prisma, member } = locals;
  const allTags = await getAllTags(prisma, true);
  if (!member) error(401, messages.events_create_not_logged_in());
  return {
    allTags,
    form: await superValidate(
      { organizer: `${member.firstName} ${member.lastName}` },
      zod4(eventSchema.and(z.object({ editType: actionType }))),
    ),
  };
};

export const actions: Actions = {
  default: createEvent,
};
