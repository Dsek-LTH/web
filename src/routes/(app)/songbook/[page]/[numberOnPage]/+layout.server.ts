import * as m from "$paraglide/messages";
import { error } from "@sveltejs/kit";
import { zod4 } from "sveltekit-superforms/adapters";
import { superValidate } from "sveltekit-superforms/server";
import { canAccessDeletedSongs, fixSongText } from "../../helpers";
import { updateSongBookEntrySchema } from "../../schema";
import type { LayoutServerLoad } from "./$types";
import { getExtendedPrismaClient } from "$lib/server/extendedPrisma";

export const load: LayoutServerLoad = async ({ locals, params }) => {
  const { prisma, user } = locals;
  const accessPolicies = user?.policies ?? [];
  const isDeletedAccessible = canAccessDeletedSongs(accessPolicies);
  const client = isDeletedAccessible
    ? getExtendedPrismaClient(locals.language, user?.studentId)
    : prisma;

  const songBookEntry = await client.songBookEntry.findUnique({
    where: {
      page_numberOnPage: {
        page: Number(params.page),
        numberOnPage: Number(params.numberOnPage),
      },
    },
    include: {
      song: true,
    },
  });

  if (songBookEntry == null) {
    throw error(404, {
      message: m.songbook_errors_songNotFound(),
    });
  }

  const form = await superValidate(
    songBookEntry,
    zod4(updateSongBookEntrySchema),
  );

  return {
    song: {
      ...songBookEntry.song,
      title: fixSongText(songBookEntry.song.title),
      lyrics: fixSongText(songBookEntry.song.lyrics),
    },
    songBookEntry,
    updateForm: form,
  };
};
