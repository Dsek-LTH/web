import type { PageServerLoad, Actions } from "./$types";
import { committeeActions } from "../committee.server";
import { serverApi } from "$lib/server/apiClient";
import { updateTimeSchema } from "./types";
import { fail } from "@sveltejs/kit";
import * as m from "$paraglide/messages";

// The committee itself (about text, positions, banner) comes from the
// committees layout; this page adds the opening hours.
export const load: PageServerLoad = async (event) => {
  const res = await serverApi(event).GET("/cafe/opening-hours", {});
  return { openingHours: res.data ?? [] };
};

export const actions: Actions = {
  ...committeeActions("cafe"),

  // One weekday's opening hours - a plain form action now, it used to be a
  // remote function (upstream's times.remote.ts). Goes through the generic
  // /info-pages/{slug} markdown endpoint, which enforces markdown:update, with
  // the same text for both languages like upstream did.
  updateHours: async (event) => {
    const formData = Object.fromEntries(await event.request.formData());
    const parsed = updateTimeSchema.safeParse(formData);
    if (!parsed.success || !parsed.data.markdownSv) {
      return fail(400, { message: m.committees_cafe_opening_updated() });
    }
    const { markdownSlug, markdownSv } = parsed.data;
    const res = await serverApi(event).PUT("/info-pages/{slug}", {
      params: { path: { slug: markdownSlug } },
      body: { markdownSv, markdownEn: markdownSv },
    });
    if (res.error) {
      return fail(res.response.status === 403 ? 403 : 400, {
        message: res.error.detail ?? "",
      });
    }
    return { message: m.committees_cafe_opening_updated() };
  },
};
