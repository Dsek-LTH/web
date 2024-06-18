import apiNames from "$lib/utils/apiNames";
import { authorize } from "$lib/utils/authorization";
import { Prisma } from "@prisma/client";
import { error, fail } from "@sveltejs/kit";
import { redirect } from "$lib/utils/redirect";
import { message, superValidate } from "sveltekit-superforms/server";
import { z } from "zod";
import { getArticleAuthorOptions } from "../../articles";
import { articleSchema } from "../../schema";
import type { Actions, PageServerLoad } from "./$types";
import * as m from "$paraglide/messages";

export const load: PageServerLoad = async ({ locals, params }) => {
  const { prisma, user } = locals;
  authorize(apiNames.NEWS.UPDATE, user);

  const allTags = await prisma.tag.findMany();
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
    form: await superValidate(article, updateSchema),
  };
};

const updateSchema = articleSchema.extend({
  slug: z.string(),
});

export const actions: Actions = {
  default: async (event) => {
    const { request, locals } = event;
    const { prisma, user } = locals;
    const form = await superValidate(request, updateSchema);
    if (!form.valid) return fail(400, { form });
    const { slug, header, body, author, tags } = form.data;
    const existingAuthor = await prisma.author.findFirst({
      where: {
        member: { id: author.memberId },
        mandateId: author.mandateId,
        customId: author.customId,
      },
    });
    try {
      await prisma.article.update({
        where: {
          slug: slug,
        },
        data: {
          header: header,
          body: body,
          author: {
            connect: existingAuthor
              ? {
                  id: existingAuthor.id,
                }
              : undefined,
            create: existingAuthor
              ? {
                  member: {
                    connect: { studentId: user?.studentId },
                  },
                  mandate: author.mandateId
                    ? {
                        connect: {
                          member: { studentId: user?.studentId },
                          id: author.mandateId,
                        },
                      }
                    : undefined,
                  customAuthor: author.customId
                    ? {
                        connect: { id: author.customId },
                      }
                    : undefined,
                }
              : undefined,
          },
          tags: {
            set: tags
              .filter((tag) => !!tag)
              .map((tag) => ({
                id: tag.id,
              })),
          },
          updatedAt: new Date(),
        },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        return message(
          form,
          {
            message: m.news_errors_articleNotFound(),
            type: "error",
          },
          { status: 400 },
        );
      }
      throw e;
    }

    throw redirect(
      `/news/${event.params.slug}`,
      {
        message: m.news_articleUpdated(),
        type: "success",
      },
      event,
    );
  },
};
