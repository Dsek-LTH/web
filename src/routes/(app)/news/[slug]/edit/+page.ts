import { api } from "$lib/api/client";
import { buildAuthorOptions, sameAuthorOption } from "$lib/news/authorOptions";
import { updateSchema } from "$lib/news/schema";
import * as m from "$paraglide/messages";
import { error } from "@sveltejs/kit";
import { zod4 } from "sveltekit-superforms/adapters";
import { superValidate } from "sveltekit-superforms/server";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ fetch, params, parent }) => {
  const { member } = await parent();
  if (!member) throw error(500, m.news_errors_memberNotFound());

  const [articleRes, mandatesRes, customAuthorsRes, committeesRes, tagsRes] =
    await Promise.all([
      api.GET("/articles/{slug}", {
        fetch,
        params: { path: { slug: params.slug }, query: { status: "any" } },
      }),
      api.GET("/members/{id}/mandates", {
        fetch,
        params: { path: { id: member.id } },
      }),
      api.GET("/custom-authors", { fetch }),
      api.GET("/committees", { fetch }),
      api.GET("/tags", { fetch }),
    ]);
  if (articleRes.error) throw error(404, m.news_errors_articleNotFound());
  if (
    mandatesRes.error ||
    customAuthorsRes.error ||
    committeesRes.error ||
    tagsRes.error
  ) {
    throw error(500, "Failed to load author/committee/tag options");
  }
  const article = articleRes.data;

  const self = {
    id: member.id,
    studentId: member.studentId ?? undefined,
    firstName: member.firstName ?? undefined,
    lastName: member.lastName ?? undefined,
    nickname: member.nickname ?? undefined,
    picturePath: member.picturePath ?? undefined,
  };
  const authorOptions = buildAuthorOptions(
    self,
    mandatesRes.data ?? [],
    customAuthorsRes.data ?? [],
  );

  // Saving always re-resolves the author's member to whoever is editing
  // (see backend/internal/articles' resolveAuthor) - there's no way to
  // "keep" a different original author. Pick the option matching the
  // article's current byline (self/one of the editor's mandates/a custom
  // author) if one exists; otherwise fall back to "post as yourself",
  // since the article will be re-attributed to the editor on save either
  // way.
  const currentAsOption = {
    type: article.author.type,
    member: self,
    position: article.author.position,
    customAuthor: article.author.customAuthor,
  };
  const selectedAuthor =
    authorOptions.find((option) => sameAuthorOption(option, currentAsOption)) ??
    authorOptions[0];

  return {
    allTags: tagsRes.data ?? [],
    authorOptions,
    form: await superValidate(
      {
        slug: article.slug,
        headerSv: article.headerSv,
        headerEn: article.headerEn ?? null,
        bodySv: article.bodySv,
        bodyEn: article.bodyEn ?? null,
        author: selectedAuthor,
        tags: (article.tags ?? []).map((tag) => ({ id: tag.id })),
        imageUrls: article.imageUrls ?? undefined,
        imageUrl: article.imageUrl ?? null,
        youtubeUrl: article.youtubeUrl ?? null,
        publishTime: article.publishedAt
          ? new Date(article.publishedAt)
          : null,
        committeeId: article.committee?.id ?? null,
        notificationText: article.notificationText ?? null,
        sendNotification: article.sendNotification,
      },
      zod4(updateSchema),
    ),
    committees: committeesRes.data ?? [],
    // Hardcoded true, matching the article detail page's canEdit/canDelete -
    // Go's auth.Require is the only real gate and it's currently the
    // all-permissions mock, so approximating a signal for a check that
    // always passes anyway is pointless. See DESIGN.md's Auth section.
    canDelete: true,
  };
};
