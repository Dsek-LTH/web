import { error, fail } from "@sveltejs/kit";
import { redirect } from "$lib/utils/redirect";
import { updateSongSchema } from "../../schema";
import { setError, superValidate } from "sveltekit-superforms/server";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
  const form = await superValidate(updateSongSchema);
  return { form };
};

export const actions: Actions = {
  update: async (event) => {
    const { request, locals } = event;
    const { prisma } = locals;
    const formData = await request.formData();
    const form = await superValidate(formData, updateSongSchema);
    if (!form.valid) return fail(400, { form });
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
    const updatedSong = await prisma.song.update({
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
    throw redirect(
      encodeURI(`/songbook/${updatedSong.slug}`),
      {
        message: "Sång uppdaterad",
        type: "success",
      },
      event,
    );
  },

  delete: async (event) => {
    const { locals, request } = event;
    const { prisma } = locals;
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
    const song = await prisma.song.update({
      where: {
        id: id,
      },
      data: {
        deletedAt: new Date(),
      },
    });
    return redirect(
      encodeURI(`/songbook/${song.slug}`),
      {
        message: "Sång borttagen",
        type: "success",
      },
      event,
    );
  },

  restore: async (event) => {
    const { locals, request } = event;
    const { prisma } = locals;
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
    const song = await prisma.song.update({
      where: {
        id: id,
      },
      data: {
        deletedAt: null,
      },
    });
    return redirect(
      encodeURI(`/songbook/${song.slug}`),
      {
        message: "Sång återställd",
        type: "success",
      },
      event,
    );
  },
};
