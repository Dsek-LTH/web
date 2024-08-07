import { superValidate } from "sveltekit-superforms/server";
import { zod } from "sveltekit-superforms/adapters";
import type { Actions, PageServerLoad } from "./$types";
import { getAllArticles } from "$lib/news/getArticles";
import { likeSchema, likesAction } from "./likes";
import { error } from "@sveltejs/kit";
import * as m from "$paraglide/messages";

const getAndValidatePage = (url: URL) => {
  const page = url.searchParams.get("page");
  if (page && Number.isNaN(Number.parseInt(page))) {
    error(422, m.news_errors_invalidPage() + ` "${page}"`);
  }
  return page ? Math.max(Number.parseInt(page) - 1, 0) : undefined;
};

export const load: PageServerLoad = async ({ locals, url }) => {
  const { prisma } = locals;
  const [[articles, pageCount], allTags] = await Promise.all([
    getAllArticles(prisma, {
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
    likeForm: await superValidate(zod(likeSchema)),
  };
};

export const actions: Actions = {
  like: likesAction(true),
  dislike: likesAction(false),
};
