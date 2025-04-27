import apiNames from "$lib/utils/apiNames";
import { authorize } from "$lib/utils/authorization";
import * as m from "$paraglide/messages";
import { error } from "@sveltejs/kit";
import { zod } from "sveltekit-superforms/adapters";
import { superValidate } from "sveltekit-superforms/server";
import { getArticleAuthorOptions } from "$lib/news/getArticles";
import type { Actions, PageServerLoad } from "./$types";
import { updateArticle } from "$lib/news/server/actions";
import { updateSchema } from "$lib/news/schema";
import { getAllTags } from "$lib/news/tags";

export const load: PageServerLoad = async ({ locals, params }) => {
  const { prisma, user } = locals;

  const allTags = await getAllTags(prisma, true);
  const article = await prisma.article.findUnique({
    where: {
      slug: params.slug,
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
  });
  if (article?.author.id !== undefined) article.author.id = "";
  if (!article) error(404, m.news_errors_articleNotFound());
  if (article.author.memberId !== user.memberId)
    authorize(apiNames.NEWS.UPDATE, user);
  const at = article.createdAt;
  const memberWithMandtes = await prisma.member.findUnique({
    where: {
      id: article?.author.memberId,
    },
    include: {
      mandates: {
        where: {
          startDate: {
            lte: at,
          },
          endDate: {
            gte: at,
          },
        },
        include: {
          position: true,
        },
      },
    },
  });

  if (!memberWithMandtes) error(500, m.news_errors_authorMemberNotFound());
  const authorOptions = await getArticleAuthorOptions(
    prisma,
    memberWithMandtes,
  );

  return {
    allTags,
    authorOptions,
    form: await superValidate(article, zod(updateSchema)),
  };
};

export const actions: Actions = {
  default: updateArticle,
};
