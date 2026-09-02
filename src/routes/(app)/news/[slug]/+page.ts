import {
  NOLLNING_TAG_PREFIX,
  POST_REVEAL_PREFIX,
} from "$lib/components/postReveal/types";
import { api } from "$lib/api/client";
import * as m from "$paraglide/messages";
import { error, redirect } from "@sveltejs/kit";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ fetch, params }) => {
  const res = await api.GET("/articles/{slug}", {
    fetch,
    params: { path: { slug: params.slug } },
  });
  if (res.error) {
    throw error(404, { message: m.news_errors_articleNotFound() });
  }
  const article = res.data;

  if (article.tags?.some((t) => t.name.startsWith(NOLLNING_TAG_PREFIX))) {
    throw redirect(302, `${POST_REVEAL_PREFIX}/messages`);
  }

  // canEdit/canDelete come straight from Go (ArticleDetail.canEdit/
  // canDelete), computed server-side from the same author-or-policy check
  // Update/Delete themselves enforce - see DESIGN.md's "Principles going
  // forward" #5. Nothing here reimplements authorization.
  return { article, canEdit: article.canEdit, canDelete: article.canDelete };
};
