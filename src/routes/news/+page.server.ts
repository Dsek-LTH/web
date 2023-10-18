import { getAllArticles } from "$lib/articles";
import prisma from "$lib/prisma";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ url }) => {
  const [articles, allTags] = await Promise.all([
    getAllArticles({
      tags: url.searchParams.getAll("tags"),
      search: url.searchParams.get("search") ?? undefined,
    }),
    prisma.tag.findMany({ orderBy: { name: "asc" } }),
  ]);
  return {
    articles,
    allTags,
  };
};
