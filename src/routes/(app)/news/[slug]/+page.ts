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

  // Go's mock auth authorizes every request as if every policy were
  // granted (see backend/CLAUDE.md's Auth section) - matching that here
  // rather than reading the SvelteKit session for a real gate, since this
  // page no longer touches that session for anything else. Revisit once
  // Go exposes the acting identity's policies to the frontend.
  return { article, canEdit: true, canDelete: true };
};
