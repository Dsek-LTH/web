import apiNames from "$lib/utils/apiNames";
import { fail } from "@sveltejs/kit";
import { superValidate } from "sveltekit-superforms/server";
import { zod4 } from "sveltekit-superforms/adapters";
import { createSongSchema } from "../schema";
import type { PageServerLoad, Actions } from "./$types";
import { authorize } from "$lib/utils/authorization";
import * as m from "$paraglide/messages";
import { redirect } from "sveltekit-flash-message/server";
import * as songs from "$lib/server/songs/service";

export const load: PageServerLoad = async ({ locals }) => {
  const { user } = locals;
  authorize(apiNames.SONG.CREATE, user);

  const [existingCategories, existingMelodies] = await Promise.all([
    songs.categories(locals),
    songs.melodies(locals),
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

    const form = await superValidate(request, zod4(createSongSchema));
    if (!form.valid) return fail(400, { form });
    const { title, melody, category, lyrics, video } = form.data;
    const result = await songs.create(locals, {
      title,
      lyrics,
      melody,
      category,
      video,
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
