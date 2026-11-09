import { POST_REVEAL_PREFIX } from "$lib/components/postReveal/types";
import { api } from "$lib/api/client";
import { commentSchema, removeCommentSchema } from "$lib/zod/comments";
import * as m from "$paraglide/messages";
import { goError } from "$lib/utils/access";
import { redirect } from "@sveltejs/kit";
import { superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import { likeSchema } from "../likes";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ fetch, params }) => {
  const res = await api.GET("/articles/{slug}", {
    fetch,
    params: { path: { slug: params.slug } },
  });
  if (res.error)
    goError(res.response, res.error, m.news_errors_articleNotFound());
  const article = res.data;

  // Nollning articles are shown on the nollning pages.
  if (article.nollningSeasonId) {
    throw redirect(302, `${POST_REVEAL_PREFIX}/messages`);
  }

  // canEdit/canDelete come straight from Go (ArticleDetail.canEdit/
  // canDelete), computed server-side from the same author-or-policy check
  // Update/Delete themselves enforce. Nothing here reimplements
  // authorization.
  return {
    article,
    canEdit: article.canEdit,
    canDelete: article.canDelete,
    // Members @mentioned in the comments, resolved by Go.
    allTaggedMembers: article.taggedMembers ?? [],
    likeForm: await superValidate(zod4(likeSchema)),
    commentForm: await superValidate(zod4(commentSchema)),
    removeCommentForm: await superValidate(zod4(removeCommentSchema)),
  };
};
