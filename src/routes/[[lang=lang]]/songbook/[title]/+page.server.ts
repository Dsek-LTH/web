import { error } from "@sveltejs/kit";
import prisma from "$lib/utils/prisma";
import { withAccess } from "$lib/utils/access";
import type { PageServerLoad } from "./$types";
import apiNames from "$lib/utils/apiNames";
import { redirect } from "sveltekit-flash-message/server";
import isomorphicDompurify from "isomorphic-dompurify";
const { sanitize } = isomorphicDompurify;
import { fixSongText } from "$lib/utils/song";

export const load: PageServerLoad = async ({ params, parent }) => {
  const { accessPolicies } = await parent();
  const song = await prisma.song.findFirst({
    where: {
      title: params.title,
    },
  });
  if (song == null) {
    throw error(404, {
      message: "Song not found",
    });
  }
  return {
    song: {
      ...song,
      title: sanitize(fixSongText(song.title)),
      lyrics: sanitize(fixSongText(song.lyrics)),
    },
    accessPolicies,
  };
};

export const actions = {
  delete: async (event) => {
    const { locals, request } = event;
    const session = await locals.getSession();
    const data = await request.formData();
    const id = data.get("id");
    if (id == null) {
      throw error(400, {
        message: "Missing id",
      });
    }
    if (typeof id !== "string") {
      throw error(400, {
        message: "Invalid id",
      });
    }
    return withAccess(apiNames.SONG.DELETE, session?.user, async () => {
      await prisma.song.delete({
        where: {
          id: id,
        },
      });
      return redirect(
        "/songbook",
        {
          message: "Sång borttagen",
          type: "success",
        },
        event,
      );
    });
  },
};
