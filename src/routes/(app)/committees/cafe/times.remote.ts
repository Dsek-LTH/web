import { form, getRequestEvent } from "$app/server";
import { updateMarkdown } from "$lib/news/markdown/mutations.server";
import { updateTimeSchema } from "./types";
import * as m from "$paraglide/messages";

export const updateHours = form(updateTimeSchema, async (data) => {
  const { locals } = getRequestEvent();
  const { user, prisma } = locals;

  const { markdownSv, markdownSlug } = data;

  if (markdownSlug && markdownSv) {
    await updateMarkdown(user, prisma, {
      name: markdownSlug,
      markdownSv,
      markdownEn: markdownSv,
    });
    return {
      message: m.committees_cafe_opening_updated(),
      type: "success" as const,
    };
  }
});
