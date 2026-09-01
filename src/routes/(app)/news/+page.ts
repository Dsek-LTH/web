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

export const load: PageLoad = async ({ fetch, url }) => {
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

  const [articlesRes, tagsRes] = await Promise.all([
    api.GET("/articles", {
      fetch,
      params: {
        query: {
          search: url.searchParams.get("search") ?? undefined,
          tags: url.searchParams.getAll("tags"),
          page,
          pageSize,
        },
      },
    }),
    // Includes nollning-prefixed tags in the filter list, unlike the old
    // Prisma-backed tag query - the Go API doesn't know about the
    // nollning feature (it isn't ported) and this isn't worth a Prisma
    // call from a page that's otherwise fully off Prisma. Acceptable per
    // DESIGN.md's mocking principle.
    api.GET("/tags", { fetch }),
  ]);
  if (articlesRes.error) throw error(500, "Failed to load articles");
  const { articles, pageCount } = articlesRes.data;

  if (pageCount > 0 && page > pageCount) {
    throw error(400, m.error_invalid_page());
  }

  return {
    articles: articles ?? [],
    pageCount,
    allTags: tagsRes.data ?? [],
  };
};
