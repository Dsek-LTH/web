import { getArticleAuthorOptions } from "$lib/news/getArticles";
import { createSchema } from "$lib/news/schema";
import { createArticle } from "$lib/news/server/actions";
import apiNames from "$lib/utils/apiNames";
import { authorize } from "$lib/utils/authorization";
import * as m from "$paraglide/messages";
import { error } from "@sveltejs/kit";
import { zod4 } from "sveltekit-superforms/adapters";
import { superValidate } from "sveltekit-superforms/server";
import type { Actions, PageServerLoad } from "./$types";
import { getAllTags } from "$lib/news/tags";

export const load: PageServerLoad = async ({ locals }) => {
  const { prisma, user } = locals;
  authorize(apiNames.NEWS.CREATE, user);

  const [allTags, currentMemberWithMandates, committees] = await Promise.all([
    getAllTags(prisma, true),
    prisma.member.findUnique({
      where: {
        studentId: user?.studentId,
      },
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
    }),
    prisma.committee.findMany({
      select: {
        id: true,
        name: true,
      },
    }),
  ]);

  if (!currentMemberWithMandates)
    throw error(500, m.news_errors_memberNotFound());
  const authorOptions = await getArticleAuthorOptions(
    prisma,
    currentMemberWithMandates,
  );
  return {
    allTags,
    authorOptions,
    form: await superValidate(
      {
        sendNotification: true,
        author: authorOptions[0],
      },
      zod4(createSchema),
      {
        errors: false,
      },
    ),
    committees,
  };
};

export const actions: Actions = {
  default: createArticle,
};
