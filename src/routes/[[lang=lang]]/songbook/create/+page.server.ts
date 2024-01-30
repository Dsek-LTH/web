import apiNames from "$lib/utils/apiNames";
import { fail } from "@sveltejs/kit";
import { redirect } from "sveltekit-flash-message/server";
import { superValidate } from "sveltekit-superforms/client";
import { createSongSchema } from "../schema";
import type { PageServerLoad, Actions } from "./$types";
import { slugifySongTitle } from "./helpers";
import { getExistingCategories, getExistingMelodies } from "../helpers";
import { authorize } from "$lib/utils/authorization";

export const load: PageServerLoad = async ({ locals }) => {
  const { prisma, user } = locals;
  authorize(apiNames.SONG.CREATE, user);

  const [existingCategories, existingMelodies] = await Promise.all([
    getExistingCategories(prisma),
    getExistingMelodies(prisma),
  ]);
  return {
    form: await superValidate(createSongSchema),
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
    const { title, melody, category, lyrics } = form.data;
    const now = new Date();
    const result = await prisma.song.create({
      data: {
        title: title,
        slug: await slugifySongTitle(prisma, title),
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
  },
};
