import { redirect } from "sveltekit-flash-message/server";
import * as m from "$paraglide/messages";
import { fail } from "@sveltejs/kit";
import { zod4 } from "sveltekit-superforms/adapters";
import { setError, superValidate } from "sveltekit-superforms/server";
import { updateSongSchema } from "../../schema";
import type { Actions } from "./$types";
import { api } from "$lib/api/client";

// Only the update action stays a SvelteKit action (a real authoring form,
// see DESIGN.md's Principle #5) - delete/restore are pure-proxy mutations
// now called directly from the client (see +page.svelte and
// [slug]/+page.svelte), matching RemoveArticleDialog.svelte's pattern. No
// `load` here: song/existingCategories/existingMelodies/updateForm all
// come from the parent +layout.ts, and song:update is enforced by Go
// itself on save, not gated again here.
export const actions: Actions = {
  update: async (event) => {
    const { request, params } = event;
    const form = await superValidate(request, zod4(updateSongSchema));
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

    const updated = await api.PATCH("/songs/{slug}", {
      params: { path: { slug: params.slug } },
      body: {
        title: data.title.trim(),
        lyrics: data.lyrics.trim(),
        melody: data.melody.trim() || undefined,
        category: data.category.trim() || undefined,
        video: data.video?.trim() || undefined,
      },
    });
    if (updated.error) throw new Error("Failed to update song");

    throw redirect(
      encodeURI(`/songbook/${updated.data.slug}`),
      {
        message: m.songbook_songUpdated(),
        type: "success",
      },
      event,
    );
  },
};
