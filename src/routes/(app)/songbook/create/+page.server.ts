import apiNames from "$lib/utils/apiNames";
import { fail } from "@sveltejs/kit";
import { superValidate } from "sveltekit-superforms/server";
import { zod4 } from "sveltekit-superforms/adapters";
import { createSongSchema } from "../schema";
import type { PageServerLoad, Actions } from "./$types";
import { slugifySongTitle } from "./helpers";
import { getExistingCategories, getExistingMelodies } from "../helpers";
import { authorize } from "$lib/utils/authorization";
import * as m from "$paraglide/messages";
import DOMPurify from "isomorphic-dompurify";
import { redirect } from "sveltekit-flash-message/server";

export const load: PageServerLoad = async ({ locals }) => {
  const { prisma, user } = locals;
  authorize(apiNames.SONG.CREATE, user);

  const [existingCategories, existingMelodies] = await Promise.all([
    getExistingCategories(prisma),
    getExistingMelodies(prisma),
  ]);
  return {
    form: await superValidate(zod4(createSongSchema)),
    existingCategories,
    existingMelodies,
  };
};

export const actions: Actions = {
  create: async (event) => {
    const { request, locals } = event;
    const { prisma } = locals;
    const form = await superValidate(request, zod4(createSongSchema));
    if (!form.valid) return fail(400, { form });
    const { title, melody, category, lyrics } = form.data;
    const now = new Date();
    const result = await prisma.song.create({
      data: {
        title: DOMPurify.sanitize(title),
        slug: await slugifySongTitle(prisma, title),
        melody: melody,
        category: category,
        lyrics: DOMPurify.sanitize(lyrics),
        createdAt: now,
        updatedAt: now,
      },
    });
    throw redirect(
      `/songbook/${result.slug}`,
      {
        message: m.songbook_songCreated(),
        type: "success",
      },
      event,
    );
  },
};
