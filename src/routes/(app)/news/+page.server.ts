import { getAllArticles } from "$lib/news/getArticles";
import { getAllTags } from "$lib/news/tags";
import { zod4 } from "sveltekit-superforms/adapters";
import { superValidate } from "sveltekit-superforms/server";
import type { Actions, PageServerLoad } from "./$types";
import { likeSchema, likesAction } from "./likes";
import {
  getPageOrThrowSvelteError,
  getPageSizeOrThrowSvelteError,
} from "$lib/utils/url.server";
import { isAuthorized } from "$lib/utils/authorization";
import apiNames from "$lib/utils/apiNames";

export const load: PageServerLoad = async ({ locals, url }) => {
  const { prisma, member, user } = locals;

  // News admins can see everyone's scheduled articles, not just their own.
  const canSeeAllScheduled = isAuthorized(apiNames.NEWS.UPDATE, user);

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

  const scheduledArticles = member
    ? await prisma.article.findMany({
        where: {
          publishedAt: {
            gt: new Date(),
          },
          ...(canSeeAllScheduled
            ? {}
            : {
                author: {
                  member: {
                    id: member.id,
                  },
                },
              }),
        },
        include: {
          author: {
            include: {
              member: true,
              mandate: {
                include: {
                  position: true,
                },
              },
              customAuthor: true,
            },
          },
          tags: true,
        },
        orderBy: {
          publishedAt: "asc",
        },
      })
    : [];

  return {
    articles,
    pageCount,
    allTags,
    likeForm: await superValidate(zod4(likeSchema)),
    scheduledArticles,
  };
};

export const actions: Actions = {
  like: likesAction(true),
  dislike: likesAction(false),
};
