import * as m from "$paraglide/messages";
import { error } from "@sveltejs/kit";
import { zod4 } from "sveltekit-superforms/adapters";
import { superValidate } from "sveltekit-superforms/server";
import * as songs from "$lib/server/songs/service";
import { NotFoundError } from "$lib/server/api/errors";
import { updateSongSchema } from "../schema";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ locals, params }) => {
  const [song, existingCategories, existingMelodies] = await Promise.all([
    songs.get(locals, params.slug).catch((err) => {
      if (err instanceof NotFoundError) {
        error(404, { message: m.songbook_errors_songNotFound() });
      }
      throw err;
    }),
    songs.categories(locals),
    songs.melodies(locals),
  ]);

  const form = await superValidate(song, zod4(updateSongSchema));

  return {
    song,
    updateForm: form,
    existingCategories,
    existingMelodies,
  };
};
