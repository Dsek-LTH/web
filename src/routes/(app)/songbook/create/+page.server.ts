import { fail } from "@sveltejs/kit";
import { superValidate } from "sveltekit-superforms/server";
import { zod4 } from "sveltekit-superforms/adapters";
import { createSongSchema } from "../schema";
import type { PageServerLoad, Actions } from "./$types";
import * as m from "$paraglide/messages";
import { redirect } from "sveltekit-flash-message/server";
import { api } from "$lib/api/client";

// Slug generation, sanitization, and the song:create check itself all
// happen server-side in the Go API (backend/internal/songs) now - this
// file just validates the form (instant-feedback UX only, per DESIGN.md's
// Principle #5 - Go's own auth.Require/validation is what actually
// decides whether the save succeeds) and forwards the result.
export const load: PageServerLoad = async ({ fetch }) => {
  const [categoriesRes, melodiesRes] = await Promise.all([
    api.GET("/songs/categories", { fetch, params: { query: { includeDeleted: false } } }),
    api.GET("/songs/melodies", { fetch, params: { query: { includeDeleted: false } } }),
  ]);
  return {
    form: await superValidate(zod4(createSongSchema)),
    existingCategories: categoriesRes.data ?? [],
    existingMelodies: melodiesRes.data ?? [],
  };
};

export const actions: Actions = {
  create: async (event) => {
    const { request } = event;
    const form = await superValidate(request, zod4(createSongSchema));
    if (!form.valid) return fail(400, { form });
    const { title, melody, category, lyrics, video } = form.data;

    const created = await api.POST("/songs", {
      body: {
        title,
        lyrics,
        melody: melody.trim() || undefined,
        category: category.trim() || undefined,
        video: video?.trim() || undefined,
      },
    });
    if (created.error) throw new Error("Failed to create song");

    throw redirect(
      `/songbook/${created.data.slug}`,
      {
        message: m.songbook_songCreated(),
        type: "success",
      },
      event,
    );
  },
};
