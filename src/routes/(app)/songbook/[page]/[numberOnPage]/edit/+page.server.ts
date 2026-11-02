import { redirect } from "sveltekit-flash-message/server";
import * as m from "$paraglide/messages";
import { error, fail } from "@sveltejs/kit";
import { zod4 } from "sveltekit-superforms/adapters";
import { setError, superValidate } from "sveltekit-superforms/server";
import { serverApi } from "$lib/server/apiClient";
import { updateSongBookEntrySchema } from "../../../schema";
import { songBookConflictField } from "../../../conflicts";
import type { Actions } from "./$types";

// song:update/song:delete and the duplicate-position/duplicate-song checks
// are all Go's (PATCH/DELETE /songbook/{page}/{numberOnPage}).
export const actions: Actions = {
  update: async (event) => {
    const { request, params } = event;
    const form = await superValidate(request, zod4(updateSongBookEntrySchema));
    if (!form.valid) return fail(400, { form });

    const res = await serverApi(event).PATCH(
      "/songbook/{page}/{numberOnPage}",
      {
        params: {
          path: {
            page: Number(params.page),
            numberOnPage: Number(params.numberOnPage),
          },
        },
        body: form.data,
      },
    );
    if (res.error) {
      const field = songBookConflictField(
        res.response.status,
        res.error.detail,
      );
      if (field === "numberOnPage") {
        return setError(
          form,
          "numberOnPage",
          m.songbook_compositeKeyDuplicateError(),
        );
      }
      if (field === "songId") {
        return setError(form, "songId", m.songbook_songIdDuplicateError());
      }
      error(res.response.status === 404 ? 404 : 400, {
        message: m.songbook_errors_songNotFound(),
      });
    }
    throw redirect(
      `/songbook/${res.data.page}/${res.data.numberOnPage}`,
      { message: m.songbook_songUpdated(), type: "success" },
      event,
    );
  },

  delete: async (event) => {
    const { params } = event;
    const res = await serverApi(event).DELETE(
      "/songbook/{page}/{numberOnPage}",
      {
        params: {
          path: {
            page: Number(params.page),
            numberOnPage: Number(params.numberOnPage),
          },
        },
      },
    );
    if (res.error) {
      error(res.response.status === 404 ? 404 : 403, {
        message: m.songbook_errors_songNotFound(),
      });
    }
    throw redirect(
      "/songbook",
      { message: m.songbook_songRemoved(), type: "success" },
      event,
    );
  },
};
