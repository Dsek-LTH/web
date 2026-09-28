import { actionType, eventSchema } from "$lib/events/schema";
import { createEvent } from "$lib/events/server/actions";
import { error } from "@sveltejs/kit";
import { zod4 } from "sveltekit-superforms/adapters";
import { superValidate } from "sveltekit-superforms/server";
import type { Actions, PageServerLoad } from "./$types";
import { getAllTags } from "$lib/news/tags";
import { z } from "zod";

export const load: PageServerLoad = async ({ locals }) => {
  const { prisma, member } = locals;
  if (!member) error(401, "Du måste vara inloggad för att skapa evenemang.");
  const [allTags, committees] = await Promise.all([
    getAllTags(prisma, true),
    prisma.committee.findMany({
      select: { id: true, name: true, shortName: true, symbolUrl: true },
    }),
  ]);
  return {
    allTags,
    committees,
    form: await superValidate(
      zod4(eventSchema.and(z.object({ editType: actionType }))),
    ),
  };
};

export const actions: Actions = {
  default: createEvent,
};
