import { policyAccessGuard, withAccess } from "$lib/utils/access";
import apiNames from "$lib/utils/apiNames";
import { fail } from "@sveltejs/kit";
import { redirect } from "sveltekit-flash-message/server";
import { superValidate } from "sveltekit-superforms/client";
import { createSongSchema } from "../schema";
import type { PageServerLoad, Actions } from "./$types";
import { slugifySongTitle } from "./helpers";
import { getExistingCategories, getExistingMelodies } from "../helpers";

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

export const actions: Actions = {
  create: async (event) => {
    const { request, locals } = event;
    const { prisma } = locals;
    const form = await superValidate(request, createSongSchema);
    if (!form.valid) return fail(400, { form });
    const session = await locals.getSession();
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
};
