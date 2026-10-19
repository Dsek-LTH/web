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
import { NOLLNING_TAG_PREFIX } from "$lib/components/postReveal/types";

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
          tags: {
            none: {
              nameSv: {
                startsWith: NOLLNING_TAG_PREFIX,
              },
            },
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

  // Nollning articles authored by current member – hidden by BASIC_ARTICLE_FILTER by default
  // Includes both published (lte now) and scheduled (gt now), filtered same way as /nollning/messages
  const nollningArticles = member
    ? await prisma.article.findMany({
        where: {
          publishedAt: {
            not: null,
          },
          OR: [{ removedAt: { gt: new Date() } }, { removedAt: null }],
          tags: {
            some: {
              nameSv: {
                startsWith: NOLLNING_TAG_PREFIX,
              },
            },
          },
          author: {
            memberId: member.id,
          },
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
          publishedAt: "desc",
        },
      })
    : [];

  return {
    articles,
    pageCount,
    allTags,
    likeForm: await superValidate(zod4(likeSchema)),
    scheduledArticles,
    nollningArticles,
  };
};

export const actions: Actions = {
  like: likesAction(true),
  dislike: likesAction(false),
};
