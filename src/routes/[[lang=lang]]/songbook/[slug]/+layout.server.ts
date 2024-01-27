import { error } from "@sveltejs/kit";
import DOMPurify from "isomorphic-dompurify";
import { fixSongText } from "../helpers";
import { updateSongSchema } from "../schema";
import { superValidate } from "sveltekit-superforms/server";
import {
  canAccessDeletedSongs,
  getExistingCategories,
  getExistingMelodies,
} from "../helpers";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ locals, params, parent }) => {
  const { prisma } = locals;
  const { accessPolicies } = await parent();
  const song = await prisma.song.findUnique({
    where: {
      slug: params.slug,
      deletedAt: canAccessDeletedSongs(accessPolicies) ? {} : null,
    },
  });

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
      title: DOMPurify.sanitize(fixSongText(song.title)),
      lyrics: DOMPurify.sanitize(fixSongText(song.lyrics)),
    },
    updateForm: form,
    existingCategories,
    existingMelodies,
  };
};
