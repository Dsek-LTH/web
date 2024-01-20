import { error } from "@sveltejs/kit";
import prisma from "$lib/utils/prisma";
import isomorphicDompurify from "isomorphic-dompurify";
const { sanitize } = isomorphicDompurify;
import { fixSongText } from "$lib/utils/song";
import { updateSongSchema } from "../schema";
import { superValidate } from "sveltekit-superforms/server";
import {
  canAccessDeletedSongs,
  getExistingCategories,
  getExistingMelodies,
} from "../helpers";
import type { Song } from "@prisma/client";

export const load = async ({ params, parent }) => {
  const { accessPolicies } = await parent();
  let song: Song | null = null;
  if (canAccessDeletedSongs(accessPolicies)) {
    song = await prisma.song.findFirst({
      where: {
        slug: params.slug,
      },
    });
  } else {
    song = await prisma.song.findFirst({
      where: {
        slug: params.slug,
        deletedAt: null,
      },
    });
  }

  if (song == null) {
    throw error(404, {
      message: "Song not found",
    });
  }

  const [existingCategories, existingMelodies] = await Promise.all([
    getExistingCategories(
      accessPolicies,
      canAccessDeletedSongs(accessPolicies),
    ),
    getExistingMelodies(accessPolicies, canAccessDeletedSongs(accessPolicies)),
  ]);

  const form = await superValidate(song, updateSongSchema);

  return {
    song: {
      ...song,
      title: sanitize(fixSongText(song.title)),
      lyrics: sanitize(fixSongText(song.lyrics)),
    },
    updateForm: form,
    existingCategories,
    existingMelodies,
  };
};
