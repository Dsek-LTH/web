import * as m from "$paraglide/messages";
import { error } from "@sveltejs/kit";
import { zod4 } from "sveltekit-superforms/adapters";
import { superValidate } from "sveltekit-superforms/server";
import { updateSongSchema } from "../schema";
import type { LayoutLoad } from "./$types";
import { api } from "$lib/api/client";

export const load: LayoutLoad = async ({ fetch, params }) => {
  const [songRes, categoriesRes, melodiesRes] = await Promise.all([
    api.GET("/songs/{slug}", {
      fetch,
      params: { path: { slug: params.slug } },
    }),
    // includeDeleted=true here (unlike the list page's grouped chips) mirrors
    // the old layout's own getExistingCategories/getExistingMelodies calls,
    // which pass isDeletedAccessible straight through - Go itself downgrades
    // this to false for a caller without song:delete either way.
    api.GET("/songs/categories", {
      fetch,
      params: { query: { includeDeleted: true } },
    }),
    api.GET("/songs/melodies", {
      fetch,
      params: { query: { includeDeleted: true } },
    }),
  ]);

  if (songRes.error) {
    throw error(404, { message: m.songbook_errors_songNotFound() });
  }
  const song = songRes.data;

  return {
    song,
    // The form gets the stored text: song.title/lyrics have the typographic
    // replacements applied, which saving would otherwise persist.
    updateForm: await superValidate(
      {
        ...song,
        title: song.rawTitle ?? song.title,
        lyrics: song.rawLyrics ?? song.lyrics,
      },
      zod4(updateSongSchema),
    ),
    existingCategories: categoriesRes.data ?? [],
    existingMelodies: melodiesRes.data ?? [],
  };
};
