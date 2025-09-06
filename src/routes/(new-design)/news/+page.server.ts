import { getAllArticles } from "$lib/news/getArticles";
import { getAllTags } from "$lib/news/tags";
import { zod } from "sveltekit-superforms/adapters";
import { superValidate } from "sveltekit-superforms/server";
import type { Actions, PageServerLoad } from "./$types";
import { likeSchema, likesAction } from "./likes";
import {
  getPageOrThrowSvelteError,
  getPageSizeOrThrowSvelteError,
} from "$lib/utils/url.server";

export const load: PageServerLoad = async ({ locals, url }) => {
  const { prisma } = locals;
  const articleCount = await prisma.article.count();
  const pageSize = getPageSizeOrThrowSvelteError(url);
  const page = getPageOrThrowSvelteError(url, {
    fallbackValue: 1,
    lowerBound: 1,
    upperBound: Math.ceil(articleCount / pageSize),
  });
  const [[articles, pageCount], allTags] = await Promise.all([
    getAllArticles(prisma, {
      tags: url.searchParams.getAll("tags"),
      search: url.searchParams.get("search") ?? undefined,
      page,
      pageSize,
    }),
    getAllTags(prisma),
  ]);
  return {
    articles,
    pageCount,
    allTags,
    likeForm: await superValidate(zod(likeSchema)),
  };
};

export const actions: Actions = {
  like: likesAction(true),
  dislike: likesAction(false),
};
