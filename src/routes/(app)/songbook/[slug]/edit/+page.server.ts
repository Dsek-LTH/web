import { redirect } from "sveltekit-flash-message/server";
import * as m from "$paraglide/messages";
import { error, fail } from "@sveltejs/kit";
import { zod4 } from "sveltekit-superforms/adapters";
import { setError, superValidate } from "sveltekit-superforms/server";
import { updateSongSchema } from "../../schema";
import type { Actions, PageServerLoad } from "./$types";
import apiNames from "$lib/utils/apiNames";
import { authorize } from "$lib/utils/authorization";
import * as songs from "$lib/server/songs/service";
import { handleServiceError } from "$lib/server/api/errors";

export const load: PageServerLoad = async ({ locals }) => {
  authorize(apiNames.SONG.UPDATE, locals.user);
  const form = await superValidate(zod4(updateSongSchema));
  return { form };
};

export const actions: Actions = {
  update: async (event) => {
    const { request, locals, params } = event;
    const formData = await request.formData();
    const form = await superValidate(formData, zod4(updateSongSchema));
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
    const updatedSong = await songs
      .update(locals, {
        slug: params.slug,
        title: data.title,
        lyrics: data.lyrics,
        melody: data.melody,
        category: data.category,
        video: data.video,
      })
      .catch(handleServiceError);
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
    authorize(apiNames.SONG.DELETE, locals.user);
    const data = await request.formData();
    const id = data.get("id");
    if (id == null) {
      throw error(400, {
        message: m.songbook_errors_missingID(),
      });
    }
    if (typeof id !== "string") {
      throw error(400, {
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

    throw redirect(
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
    authorize(apiNames.SONG.DELETE, locals.user);
    const data = await request.formData();
    const id = data.get("id");
    if (id == null) {
      throw error(400, {
        message: m.songbook_errors_missingID(),
      });
    }
    if (typeof id !== "string") {
      throw error(400, {
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
    throw redirect(
      encodeURI(`/songbook/${song.slug}`),
      {
        message: m.songbook_songRestored(),
        type: "success",
      },
      event,
    );
  },
};
