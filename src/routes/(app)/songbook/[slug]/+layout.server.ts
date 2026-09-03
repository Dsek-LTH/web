import * as m from "$paraglide/messages";
import { error } from "@sveltejs/kit";
import { zod4 } from "sveltekit-superforms/adapters";
import { superValidate } from "sveltekit-superforms/server";
import {
  canAccessDeletedSongs,
  fixSongText,
  getExistingCategories,
  getExistingMelodies,
} from "../helpers";
import { updateSongSchema } from "../schema";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ locals, params }) => {
  const { prisma, user } = locals;
  const accessPolicies = user?.policies ?? [];
  const isDeletedAccessible = canAccessDeletedSongs(accessPolicies);

  const song = await prisma.song.findUnique({
    where: {
      slug: params.slug,
    },
  });

  if (song == null) {
    throw error(404, {
      message: m.songbook_errors_songNotFound(),
    });
  }

  const [existingCategories, existingMelodies] = await Promise.all([
    getExistingCategories(prisma, accessPolicies, isDeletedAccessible),
    getExistingMelodies(prisma, accessPolicies, isDeletedAccessible),
  ]);

  const form = await superValidate(song, zod4(updateSongSchema));

  return {
    song: {
      ...song,
      title: fixSongText(song.title),
      lyrics: fixSongText(song.lyrics),
    },
    updateForm: form,
    existingCategories,
    existingMelodies,
  };
};
