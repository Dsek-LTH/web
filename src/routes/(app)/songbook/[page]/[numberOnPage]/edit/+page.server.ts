import { redirect } from "sveltekit-flash-message/server";
import * as m from "$paraglide/messages";
import { fail } from "@sveltejs/kit";
import { zod4 } from "sveltekit-superforms/adapters";
import { setError, superValidate } from "sveltekit-superforms/server";
import { updateSongBookEntrySchema } from "../../../schema";
import type { Actions, PageServerLoad } from "./$types";
import apiNames from "$lib/utils/apiNames";
import { authorize } from "$lib/utils/authorization";

export const load: PageServerLoad = async ({ locals, parent }) => {
  authorize(apiNames.SONG.UPDATE, locals.user);
  const form = await superValidate(
    (await parent()).songBookEntry,
    zod4(updateSongBookEntrySchema),
  );
  return { form };
};

export const actions: Actions = {
  update: async (event) => {
    const { request, locals, params } = event;
    authorize(apiNames.SONG.UPDATE, locals.user);
    const { prisma } = locals;
    const formData = await request.formData();
    const form = await superValidate(formData, zod4(updateSongBookEntrySchema));
    if (!form.valid) return fail(400, { form });
    const data = form.data;
    if (data.songId == null) {
      return setError(form, "songId", m.songbook_missingTitle());
    }
    if (data.page == null) {
      return setError(form, "page", m.songbook_missingLyrics());
    }
    if (data.numberOnPage == null) {
      return setError(form, "numberOnPage", m.songbook_missingCategory());
    }
    const originalPage = Number(params.page);
    const originalNumber = Number(params.numberOnPage);

    if (
      (await prisma.songBookEntry.count({
        where: { page: data.page, numberOnPage: data.numberOnPage },
      })) > 0
    ) {
      return setError(
        form,
        "numberOnPage",
        m.songbook_compositeKeyDuplicateError(),
      );
    }

    const updatedSong = await prisma.songBookEntry.update({
      where: {
        page_numberOnPage: { page: originalPage, numberOnPage: originalNumber },
      },
      data,
    });
    throw redirect(
      encodeURI(`/songbook/${updatedSong.page}/${updatedSong.numberOnPage}`),
      {
        message: m.songbook_songUpdated(),
        type: "success",
      },
      event,
    );
  },

  delete: async (event) => {
    const { locals, params } = event;
    const { prisma } = locals;
    authorize(apiNames.SONG.DELETE, locals.user);

    const originalPage = Number(params.page);
    const originalNumber = Number(params.numberOnPage);

    await prisma.songBookEntry.delete({
      where: {
        page_numberOnPage: { page: originalPage, numberOnPage: originalNumber },
      },
    });

    throw redirect(
      encodeURI(`/songbook`),
      {
        message: m.songbook_songRemoved(),
        type: "success",
      },
      event,
    );
  },
};
