import { error, fail } from "@sveltejs/kit";
import { redirect } from "$lib/utils/redirect";
import { superValidate } from "sveltekit-superforms/server";
import { zod } from "sveltekit-superforms/adapters";
import { eventSchema } from "$lib/events/schema";
import type { Actions, PageServerLoad } from "./$types";
import { slugWithCount, slugify } from "$lib/utils/slugify";
import dayjs from "dayjs";
import {
  getIncrementType,
  isRecurringType,
  type RecurringType,
} from "$lib/utils/events";
import { createEvent } from "$lib/events/server/actions";

export const load: PageServerLoad = async ({ locals }) => {
  const { prisma, member } = locals;
  const allTags = await prisma.tag.findMany();
  if (!member) error(401, "Du måste vara inloggad för att skapa evenemang.");
  return {
    allTags,
    form: await superValidate(
      { organizer: `${member.firstName} ${member.lastName}` },
      zod(eventSchema),
    ),
  };
};

export const actions: Actions = {
  default: createEvent,
};
