import { error, fail } from "@sveltejs/kit";
import { setError, superValidate } from "sveltekit-superforms/server";
import { zod4 } from "sveltekit-superforms/adapters";
import { createSongBookEntrySchema } from "../schema";
import { songBookConflictField } from "../conflicts";
import type { PageServerLoad, Actions } from "./$types";
import * as m from "$paraglide/messages";
import { redirect } from "sveltekit-flash-message/server";
import { serverApi } from "$lib/server/apiClient";

// song:create and the duplicate-position/duplicate-song checks are Go's
// (POST /songbook-entries) - the form validation here is instant feedback only.
export const load: PageServerLoad = async () => {
  return {
    form: await superValidate(zod4(createSongBookEntrySchema)),
  };
};

export const actions: Actions = {
  create: async (event) => {
    const form = await superValidate(
      event.request,
      zod4(createSongBookEntrySchema),
    );
    if (!form.valid) return fail(400, { form });

    const res = await serverApi(event).POST("/songbook-entries", {
      body: form.data,
    });
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
      error(res.response.status === 403 ? 403 : 400, {
        message: res.error.detail ?? m.songbook_errors_songNotFound(),
      });
    }

    throw redirect(
      `/songbook/${res.data.page}/${res.data.numberOnPage}`,
      { message: m.songbook_songCreated(), type: "success" },
      event,
    );
  },
};
