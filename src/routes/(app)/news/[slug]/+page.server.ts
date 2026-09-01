import { api } from "$lib/api/client";
import { redirect } from "sveltekit-flash-message/server";
import { commentAction, removeCommentAction } from "$lib/zod/comments";
import * as m from "$paraglide/messages";
import { error } from "@sveltejs/kit";
import { likesAction } from "../likes";
import type { Actions } from "./$types";

export const actions: Actions = {
  like: likesAction(true),
  dislike: likesAction(false),
  comment: commentAction("NEWS"),
  removeComment: removeCommentAction("NEWS"),
  removeArticle: async (event) => {
    const { params } = event;

    // No SvelteKit-side authorize() gate here - the Go API enforces this
    // itself (currently via mock auth that always succeeds) - see
    // backend/CLAUDE.md's Auth section.
    const res = await api.DELETE("/articles/{slug}", {
      params: { path: { slug: params.slug } },
    });
    if (res.error) {
      if (res.response.status === 404) {
        return error(404, m.news_errors_articleNotFound());
      }
      return error(500, "Failed to delete article");
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
