import { policyAccessGuard, withAccess } from "$lib/utils/access";
import apiNames from "$lib/utils/apiNames";
import prisma from "$lib/utils/prisma";
import { fail, type Actions } from "@sveltejs/kit";
import { redirect } from "sveltekit-flash-message/server";
import { superValidate } from "sveltekit-superforms/client";
import { createSongSchema } from "../schema";
import type { PageServerLoad } from "./$types";
import { slugifySongTitle } from "./helpers";
import { getExistingCategories, getExistingMelodies } from "../songUtils";

export const load: PageServerLoad = async ({ parent }) => {
  const { accessPolicies } = await parent();
  policyAccessGuard(apiNames.SONG.CREATE, accessPolicies);
  const [existingCategories, existingMelodies] = await Promise.all([
    getExistingCategories(),
    getExistingMelodies(),
  ]);
  return {
    form: await superValidate(createSongSchema),
    accessPolicies,
    existingCategories,
    existingMelodies,
  };
};

export const actions = {
  create: async (event) => {
    const form = await superValidate(event.request, createSongSchema);
    if (!form.valid) return fail(400, { form });
    const session = await event.locals.getSession();
    return withAccess(apiNames.SONG.CREATE, session?.user, async () => {
      const { title, melody, category, lyrics } = form.data;
      const now = new Date();
      const result = await prisma.song.create({
        data: {
          title: title,
          slug: await slugifySongTitle(title),
          melody: melody,
          category: category,
          lyrics: lyrics,
          createdAt: now,
          updatedAt: now,
        },
      });
      throw redirect(
        `/songbook/${result.slug}`,
        {
          message: "Sång skapad",
          type: "success",
        },
        event,
      );
    });
  },
} satisfies Actions;
