import { error } from "@sveltejs/kit";
import * as m from "$paraglide/messages";
import { api } from "$lib/api/client";
import type { PageLoad } from "./$types";

function intParam(
  url: URL,
  name: string,
  fallback: number,
  lowerBound: number,
  upperBound: number,
  errorMessage: string,
): number {
  const raw = url.searchParams.get(name);
  const value = raw === null ? fallback : parseInt(raw);
  if (isNaN(value) || value < lowerBound || value > upperBound) {
    throw error(400, errorMessage);
  }
  return value;
}

export const load: PageLoad = async ({ fetch, url, parent }) => {
  const pageSize = intParam(
    url,
    "pageSize",
    10,
    1,
    100,
    m.error_invalid_page_size(),
  );
  const page = intParam(
    url,
    "page",
    1,
    1,
    Number.MAX_SAFE_INTEGER,
    m.error_invalid_page(),
  );

  const { member } = await parent();

  // Old links filter by tag name (/news?tags=Sexmästeriet), so names are
  // matched (either language, any case) as well as ids; Go takes ids.
  // Unknown ones are dropped, like on /events.
  const tagsRes = await api.GET("/tags", { fetch });
  const allTags = tagsRes.data ?? [];
  const requestedTags = url.searchParams
    .getAll("tags")
    .map((tag) => tag.toLowerCase());
  const tagIds = allTags
    .filter((tag) =>
      [tag.id, tag.nameSv, tag.nameEn].some(
        (key) => key && requestedTags.includes(key.toLowerCase()),
      ),
    )
    .map((tag) => tag.id);

  const [articlesRes, scheduledRes] = await Promise.all([
    api.GET("/articles", {
      fetch,
      params: {
        query: {
          search: url.searchParams.get("search") ?? undefined,
          tags: tagIds,
          page,
          pageSize,
        },
      },
    }),
    // The caller's own scheduled articles (everyone's for news editors);
    // Go decides which.
    member
      ? api.GET("/articles", {
          fetch,
          params: { query: { onlyUnpublished: true, pageSize: 100 } },
        })
      : undefined,
  ]);
  if (articlesRes.error)
    error(
      articlesRes.response.status,
      articlesRes.error.detail ?? "Failed to load articles",
    );
  const { articles, pageCount } = articlesRes.data;

  if (pageCount > 0 && page > pageCount) {
    throw error(400, m.error_invalid_page());
  }

  return {
    articles: articles ?? [],
    pageCount,
    allTags,
    scheduledArticles: scheduledRes?.data?.articles ?? [],
  };
};
