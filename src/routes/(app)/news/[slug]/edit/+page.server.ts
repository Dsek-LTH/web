import apiNames from "$lib/utils/apiNames";
import { authorise, isAuthorised } from "$lib/utils/authorization";
import * as m from "$paraglide/messages";
import { error } from "@sveltejs/kit";
import { redirect } from "sveltekit-flash-message/server";
import { zod4 } from "sveltekit-superforms/adapters";
import { superValidate } from "sveltekit-superforms/server";
import { getArticleAuthorOptions } from "$lib/news/getArticles";
import type { Actions, PageServerLoad } from "./$types";
import { updateArticle } from "$lib/news/server/actions";
import { updateSchema } from "$lib/news/schema";
import { getAllTags } from "$lib/news/tags";

export const load: PageServerLoad = async ({ locals, params }) => {
  const { prisma, user } = locals;

  const [allTags, article, committees] = await Promise.all([
    getAllTags(prisma, true),
    prisma.article.findUnique({
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
    }),
    prisma.committee.findMany({
      select: {
        id: true,
        name: true,
      },
    }),
  ]);

  if (article?.author.id !== undefined) article.author.id = "";
  if (!article) throw error(404, m.news_errors_article_not_found());
  if (article.author.memberId !== user.memberId)
    authorise(apiNames.NEWS.UPDATE, user);
  const at = article.createdAt;
  const memberWithMandates = await prisma.member.findUnique({
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

  if (!memberWithMandates)
    throw error(500, m.news_errors_author_member_not_found());
  const authorOptions = await getArticleAuthorOptions(
    prisma,
    memberWithMandates,
  );

  const canDelete = isAuthorised(apiNames.NEWS.DELETE, user);

  return {
    allTags,
    authorOptions,
    form: await superValidate(
      {
        ...article,
        publishTime: article.publishedAt,
        sendNotification: article.shouldSendNotification ?? false,
      },
      zod4(updateSchema),
    ),
    committees,
    canDelete,
    slug: article.slug,
  };
};

export const actions: Actions = {
  update: updateArticle,
  removeArticle: async (event) => {
    const { locals, params } = event;
    const { prisma, user } = locals;
    authorise(apiNames.NEWS.DELETE, user);

    const existingArticle = await prisma.article.findUnique({
      where: {
        slug: params.slug,
      },
    });

    if (!existingArticle) return error(404, m.news_errors_article_not_found());

    await prisma.article.update({
      where: {
        slug: params.slug,
      },
      data: {
        removedAt: new Date(),
      },
    });

    throw redirect(
      "/news",
      {
        message: m.news_article_deleted(),
        type: "success",
      },
      event,
    );
  },
};
