import { getAllArticles } from "$lib/news/getArticles";
import { getAllTags } from "$lib/news/tags";
import * as m from "$paraglide/messages";
import { error } from "@sveltejs/kit";
import { zod } from "sveltekit-superforms/adapters";
import { superValidate } from "sveltekit-superforms/server";
import type { Actions, PageServerLoad } from "./$types";
import { likeSchema, likesAction } from "./likes";
import { tracer } from "../../../hooks.server";

const getAndValidatePage = (url: URL) => {
  const page = url.searchParams.get("page");
  if (page && Number.isNaN(Number.parseInt(page))) {
    error(422, m.news_errors_invalidPage() + ` "${page}"`);
  }
  return page ? Math.max(Number.parseInt(page) - 1, 0) : undefined;
};

export const load: PageServerLoad = async ({ locals, url }) => {
  const { articles, pageCount, allTags } = await tracer.startActiveSpan(
    "news_page_load",
    async (span) => {
      const { prisma } = locals;
      const [[articles, pageCount], allTags] = await Promise.all([
        getAllArticles(prisma, {
          tags: url.searchParams.getAll("tags"),
          search: url.searchParams.get("search") ?? undefined,
          page: getAndValidatePage(url),
        }),
        getAllTags(prisma),
      ]);
      span.end();
      return { articles, pageCount, allTags };
    },
  );
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
