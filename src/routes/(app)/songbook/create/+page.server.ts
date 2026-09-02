import apiNames from "$lib/utils/apiNames";
import { fail } from "@sveltejs/kit";
import { superValidate } from "sveltekit-superforms/server";
import { zod4 } from "sveltekit-superforms/adapters";
import { createSongBookEntrySchema } from "../schema";
import type { PageServerLoad, Actions } from "./$types";
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
    form: await superValidate(zod4(createSongBookEntrySchema)),
    existingCategories,
    existingMelodies,
  };
};

export const actions: Actions = {
  create: async (event) => {
    const { request, locals } = event;
    const { prisma, user } = locals;
    authorize(apiNames.SONG.CREATE, user);

    const form = await superValidate(request, zod4(createSongBookEntrySchema));
    if (!form.valid) return fail(400, { form });
    const { songId, page, numberOnPage } = form.data;
    const result = await prisma.songBookEntry.create({
      data: {
        songId: DOMPurify.sanitize(songId),
        page,
        numberOnPage,
      },
    });
    throw redirect(
      `/songbook/${result.page}/${result.numberOnPage}`,
      {
        message: m.songbook_songCreated(),
        type: "success",
      },
      event,
    );
  },
};
