import { serverApi } from "$lib/server/apiClient";
import { commentAction, removeCommentAction } from "$lib/server/comments";
import * as m from "$paraglide/messages";
import { error, type Action } from "@sveltejs/kit";
import { redirect } from "sveltekit-flash-message/server";
import type { Actions } from "./$types";

// The load is universal (+page.ts); these are the page's form actions, all
// thin proxies to Go - likes, comments and delete are each enforced there.

const likeAction =
  (like: boolean): Action<{ slug: string }> =>
  async (event) => {
    const api = serverApi(event);
    const params = { path: { slug: event.params.slug } };
    const res = like
      ? await api.PUT("/articles/{slug}/like", { params })
      : await api.DELETE("/articles/{slug}/like", { params });
    if (res.error) {
      error(res.response.status === 404 ? 404 : 403, {
        message: m.news_errors_articleNotFound(),
      });
    }
  };

export const actions: Actions = {
  like: likeAction(true),
  dislike: likeAction(false),
  comment: commentAction("NEWS"),
  removeComment: removeCommentAction("NEWS"),
  removeArticle: async (event) => {
    const res = await serverApi(event).DELETE("/articles/{slug}", {
      params: { path: { slug: event.params.slug } },
    });
    if (res.error) {
      error(res.response.status === 404 ? 404 : 403, {
        message: m.news_errors_articleNotFound(),
      });
    }
    redirect(
      "/news",
      { message: m.news_articleDeleted(), type: "success" },
      event,
    );
  },
};
