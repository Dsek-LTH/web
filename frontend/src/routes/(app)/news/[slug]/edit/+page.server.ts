import { serverApi } from "$lib/server/apiClient";
import { updateArticle } from "$lib/news/server/actions";
import * as m from "$paraglide/messages";
import { redirect } from "sveltekit-flash-message/server";
import type { Actions } from "./$types";

// No SvelteKit-side authorize() gate here - the Go API enforces this
// itself (currently via mock auth that always succeeds) - see
// backend/CLAUDE.md's Auth section.
export const actions: Actions = {
  update: updateArticle,
  removeArticle: async (event) => {
    const { params } = event;

    const res = await serverApi(event).DELETE("/articles/{slug}", {
      params: { path: { slug: params.slug } },
    });
    if (res.error) {
      throw redirect(
        `/news/${params.slug}/edit`,
        {
          message: m.news_errors_articleNotFound(),
          type: "error",
        },
        event,
      );
    }

    throw redirect(
      "/news",
      {
        message: m.news_articleDeleted(),
        type: "success",
      },
      event,
    );
  },
};
