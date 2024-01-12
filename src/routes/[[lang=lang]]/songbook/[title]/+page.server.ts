import { error, fail } from "@sveltejs/kit";
import prisma from "$lib/utils/prisma";
import { withAccess } from "$lib/utils/access";
import type { PageServerLoad } from "./$types";
import apiNames from "$lib/utils/apiNames";
import { redirect } from "sveltekit-flash-message/server";
import isomorphicDompurify from "isomorphic-dompurify";
const { sanitize } = isomorphicDompurify;
import { fixSongText } from "$lib/utils/song";
import { updateSongSchema } from "../schema";
import { message, setError, superValidate } from "sveltekit-superforms/server";
import type { Song } from "@prisma/client";

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
  const form = await superValidate(song, updateSongSchema);
  const existingCategories = (
    await prisma.song.findMany({
      distinct: ["category"],
      orderBy: {
        category: "asc",
      },
    })
  ).reduce<Array<NonNullable<Song["category"]>>>((acc, cur) => {
    if (cur.category !== null) {
      acc.push(cur.category);
    }
    return acc;
  }, []);

  const existingMelodies = (
    await prisma.song.findMany({
      distinct: ["melody"],
      orderBy: {
        melody: "asc",
      },
    })
  ).reduce<Array<NonNullable<Song["melody"]>>>((acc, cur) => {
    if (cur.melody !== null) {
      acc.push(cur.melody);
    }
    return acc;
  }, []);

  return {
    song: {
      ...song,
      title: sanitize(fixSongText(song.title)),
      lyrics: sanitize(fixSongText(song.lyrics)),
    },
    accessPolicies,
    form,
    existingCategories,
    existingMelodies,
  };
};

export const actions = {
  update: async ({ request, locals }) => {
    const formData = await request.formData();
    const form = await superValidate(formData, updateSongSchema);
    if (!form.valid) return fail(400, { form });
    const session = await locals.getSession();
    return withAccess(apiNames.SONG.UPDATE, session?.user, async () => {
      const data = form.data;
      if (data.title == null) {
        return setError(form, "title", "Titel saknas");
      }
      if (data.lyrics == null) {
        return setError(form, "lyrics", "Text saknas");
      }
      if (data.category == null) {
        return setError(form, "category", "Kategori saknas");
      }
      if (data.melody == null) {
        return setError(form, "melody", "Melodi saknas");
      }
      await prisma.song.update({
        where: {
          id: data.id,
        },
        data: {
          title: data.title.trim(),
          lyrics: data.lyrics.trim(),
          melody: data.melody.trim(),
          category: data.category.trim(),
          updatedAt: new Date(),
        },
      });
      return message(form, {
        message: "Sång uppdaterad",
        type: "success",
      });
    });
  },

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
