import { actionType, eventSchema } from "$lib/events/schema";
import { createEvent } from "$lib/events/server/actions";
import { error } from "@sveltejs/kit";
import { zod4 } from "sveltekit-superforms/adapters";
import { superValidate } from "sveltekit-superforms/server";
import type { Actions, PageServerLoad } from "./$types";
import { getAllTags } from "$lib/news/tags";
import { z } from "zod";
import apiNames from "$lib/utils/apiNames";
import { authorize } from "$lib/utils/authorization";

export const load: PageServerLoad = async ({ locals }) => {
  const { prisma, member, user } = locals;
  const allTags = await getAllTags(prisma, true);
  if (!member) error(401, "Du måste vara inloggad för att skapa evenemang.");
  authorize(apiNames.EVENT.CREATE, user);
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
