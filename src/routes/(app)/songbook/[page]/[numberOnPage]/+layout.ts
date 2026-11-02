import { api } from "$lib/api/client";
import * as m from "$paraglide/messages";
import { error } from "@sveltejs/kit";
import { zod4 } from "sveltekit-superforms/adapters";
import { superValidate } from "sveltekit-superforms";
import { updateSongBookEntrySchema } from "../../schema";
import type { LayoutLoad } from "./$types";

export const load: LayoutLoad = async ({ fetch, params }) => {
  const res = await api.GET("/songbook/{page}/{numberOnPage}", {
    fetch,
    params: {
      path: {
        page: Number(params.page),
        numberOnPage: Number(params.numberOnPage),
      },
    },
  });
  if (res.error) {
    error(404, { message: m.songbook_errors_songNotFound() });
  }
  const entry = res.data;

  return {
    // Title/lyrics already have FixSongText applied by Go.
    song: entry.song,
    songBookEntry: { page: entry.page, numberOnPage: entry.numberOnPage },
    updateForm: await superValidate(
      {
        songId: entry.song.id,
        page: entry.page,
        numberOnPage: entry.numberOnPage,
      },
      zod4(updateSongBookEntrySchema),
    ),
  };
};
