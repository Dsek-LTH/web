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
        params: {
          path: { slug: params.slug },
          query: { includeDeleted: true, includeUnpublished: true },
        },
      }),
      api.GET("/members/{studentId}/mandates", {
        fetch,
        params: { path: { studentId: member.studentId } },
      }),
      api.GET("/custom-authors", { fetch }),
      api.GET("/committees", { fetch }),
      api.GET("/tags", { fetch }),
    ]);
  if (articleRes.error) throw error(404, m.news_errors_articleNotFound());
  const failed = [mandatesRes, customAuthorsRes, committeesRes, tagsRes].find(
    (res) => res.error,
  );
  if (failed?.error)
    error(
      failed.response.status,
      failed.error.detail ?? "Failed to load author/committee/tag options",
    );
  const article = articleRes.data;

  const self = {
    id: member.id,
    studentId: member.studentId,
    firstName: member.firstName,
    lastName: member.lastName,
    nickname: member.nickname,
    picturePath: member.picturePath,
  };
  const authorOptions = buildAuthorOptions(
    self,
    mandatesRes.data ?? [],
    customAuthorsRes.data ?? [],
  );

  // Saving always re-resolves the author's member to whoever is editing
  // (see apps/api/internal/articles' resolveAuthor) - there's no way to
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
        // Only a scheduled article (going live later) has a publish time to
        // edit; a live one's date stays as it is (see updateArticle).
        publishTime:
          article.publishedAt && new Date(article.publishedAt) > new Date()
            ? new Date(article.publishedAt)
            : null,
        committeeId: article.committee?.id ?? null,
        notificationText: article.notificationText ?? null,
        sendNotification: article.sendNotification,
      },
      zod4(updateSchema),
    ),
    committees: committeesRes.data ?? [],
    // The editor preview shows the article's own creation date.
    createdAt: new Date(article.createdAt),
    now: new Date(),
    // From Go (ArticleDetail.canDelete) - see the article detail page's
    // +page.ts.
    canDelete: article.canDelete,
  };
};
