import { api } from "$lib/api/client";
import { buildAuthorOptions, sameAuthorOption } from "$lib/news/authorOptions";
import { updateSchema } from "$lib/news/schema";
import * as m from "$paraglide/messages";
import { error } from "@sveltejs/kit";
import { zod4 } from "sveltekit-superforms/adapters";
import { superValidate } from "sveltekit-superforms/server";
import type { PageLoad } from "./$types";
import { requireCanEdit } from "$lib/utils/access";

export const load: PageLoad = async ({ fetch, params, parent }) => {
  const { member, user } = await parent();
  if (!member) throw error(401, m.errors_notLoggedIn());

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
  requireCanEdit(user, article.canEdit);

  const self = {
    id: member.id,
    studentId: member.studentId,
    firstName: member.firstName,
    lastName: member.lastName,
    nickname: member.nickname,
    picturePath: member.picturePath,
  };
  // Only the author can change the byline; Go keeps the current author when
  // anyone else saves (see apps/api/internal/articles' Update), so they
  // only get the current byline to pick. The author also keeps their
  // current byline as an option when its mandate has since ended.
  const isAuthor = article.author.member.id === member.id;
  const currentAsOption = {
    type: article.author.type,
    member: isAuthor ? self : article.author.member,
    position: article.author.position,
    mandateId: article.author.mandateId,
    customAuthor: article.author.customAuthor,
  };
  const authorOptions = isAuthor
    ? buildAuthorOptions(
        self,
        mandatesRes.data ?? [],
        customAuthorsRes.data ?? [],
      )
    : [];
  const selectedAuthor =
    authorOptions.find((option) => sameAuthorOption(option, currentAsOption)) ??
    currentAsOption;
  if (!authorOptions.includes(selectedAuthor))
    authorOptions.unshift(selectedAuthor);

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
