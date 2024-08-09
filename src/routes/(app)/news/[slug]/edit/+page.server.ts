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
  authorize(apiNames.NEWS.UPDATE, user);

  const allTags = await getAllTags(prisma, true);
  const article = await prisma.article.findUnique({
    where: {
      slug: params.slug,
    },
    include: {
      author: {
        include: {
          member: {
            include: {
              mandates: {
                where: {
                  startDate: {
                    lte: new Date(),
                  },
                  endDate: {
                    gte: new Date(),
                  },
                },
                include: {
                  position: true,
                },
              },
            },
          },
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
  if (!article) throw error(404, m.news_errors_articleNotFound());

  const authorMemberWithMandates = article.author.member;
  if (!authorMemberWithMandates)
    throw error(500, m.news_errors_authorMemberNotFound());
  const authorOptions = await getArticleAuthorOptions(
    prisma,
    authorMemberWithMandates,
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
