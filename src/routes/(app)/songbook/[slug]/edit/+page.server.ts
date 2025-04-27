import { redirect } from "$lib/utils/redirect";
import * as m from "$paraglide/messages";
import { error, fail } from "@sveltejs/kit";
import DOMPurify from "isomorphic-dompurify";
import { zod } from "sveltekit-superforms/adapters";
import { setError, superValidate } from "sveltekit-superforms/server";
import { updateSongSchema } from "../../schema";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
  const form = await superValidate(zod(updateSongSchema));
  return { form };
};

export const actions: Actions = {
  update: async (event) => {
    const { request, locals } = event;
    const { prisma } = locals;
    const formData = await request.formData();
    const form = await superValidate(formData, zod(updateSongSchema));
    if (!form.valid) return fail(400, { form });
    const data = form.data;
    if (data.title == null) {
      return setError(form, "title", m.songbook_missingTitle());
    }
    if (data.lyrics == null) {
      return setError(form, "lyrics", m.songbook_missingLyrics());
    }
    if (data.category == null) {
      return setError(form, "category", m.songbook_missingCategory());
    }
    if (data.melody == null) {
      return setError(form, "melody", m.songbook_missingMelody());
    }
    const updatedSong = await prisma.song.update({
      where: {
        id: data.id,
      },
      data: {
        title: DOMPurify.sanitize(data.title.trim()),
        lyrics: DOMPurify.sanitize(data.lyrics.trim()),
        melody: data.melody.trim(),
        category: data.category.trim(),
        updatedAt: new Date(),
      },
    });
    throw redirect(
      encodeURI(`/songbook/${updatedSong.slug}`),
      {
        message: m.songbook_songUpdated(),
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
      error(400, {
        message: m.songbook_errors_missingID(),
      });
    }
    if (typeof id !== "string") {
      error(400, {
        message: m.songbook_errors_invalidID(),
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
        message: m.songbook_songRemoved(),
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
      error(400, {
        message: m.songbook_errors_missingID(),
      });
    }
    if (typeof id !== "string") {
      error(400, {
        message: m.songbook_errors_invalidID(),
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
        message: m.songbook_songRestored(),
        type: "success",
      },
      event,
    );
  },
};
