import { superValidate } from "sveltekit-superforms/server";
import type { Actions, PageServerLoad } from "./$types";
import { getAllArticles } from "./articles";
import { likeSchema, likesAction } from "./likes";

const getAndValidatePage = (url: URL) => {
  const page = url.searchParams.get("page");
  if (page && Number.isNaN(Number.parseInt(page))) {
    throw new Error("Invalid page");
  }
  return page ? Math.max(Number.parseInt(page) - 1, 0) : undefined;
};

export const load: PageServerLoad = async ({ locals, url }) => {
  const { prisma } = locals;
  const [[articles, pageCount], allTags] = await Promise.all([
    getAllArticles({
      tags: url.searchParams.getAll("tags"),
      search: url.searchParams.get("search") ?? undefined,
      page: getAndValidatePage(url),
    }),
    prisma.tag.findMany({ orderBy: { name: "asc" } }),
  ]);
  return {
    articles,
    pageCount,
    allTags,
    likeForm: await superValidate(likeSchema),
  };
};

export const actions: Actions = {
  like: likesAction(true),
  dislike: likesAction(false),
};
