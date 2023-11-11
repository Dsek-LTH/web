import { policyAccessGuard, withAccess } from "$lib/utils/access";
import apiNames from "$lib/utils/apiNames";
import prisma from "$lib/utils/prisma";
import { Prisma } from "@prisma/client";
import { error, fail } from "@sveltejs/kit";
import { message, superValidate } from "sveltekit-superforms/server";
import { z } from "zod";
import { getArticleAuthorOptions } from "../../articles";
import { articleSchema } from "../../schema";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ parent, params }) => {
  const allTags = await prisma.tag.findMany();
  const { accessPolicies } = await parent();
  policyAccessGuard(apiNames.NEWS.UPDATE, accessPolicies);
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
  if (!article) throw error(404, "Article not found");

  const authorMemberWithMandates = article.author.member;
  if (!authorMemberWithMandates) throw error(500, "Author member not found");
  const authorOptions = await getArticleAuthorOptions(authorMemberWithMandates);

  return {
    allTags,
    authorOptions,
    form: superValidate(article, updateSchema),
  };
};

const updateSchema = articleSchema.extend({
  slug: z.string(),
});

export const actions = {
  default: async ({ request, locals }) => {
    const form = await superValidate(request, updateSchema);
    if (!form.valid) return fail(400, { form });
    const session = await locals.getSession();
    return withAccess(
      apiNames.NEWS.UPDATE,
      session?.user,
      async () => {
        const { slug, header, body, author, tags } = form.data;
        const existingAuthor = await prisma.author.findFirst({
          where: {
            member: {
              id: author.memberId,
            },
            mandateId: author.mandateId,
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
                  ? undefined
                  : {
                      member: {
                        connect: {
                          studentId: session!.user.student_id,
                        },
                      },
                      mandate: author.mandateId
                        ? {
                            connect: {
                              member: {
                                studentId: session!.user.student_id,
                              },
                              id: author.mandateId,
                            },
                          }
                        : undefined,
                    },
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
                message: "Artikel kunde inte hittas",
                type: "error",
              },
              { status: 400 }
            );
          }
          throw e;
        }
        return message(form, {
          message: "Artikel uppdaterad",
          type: "success",
        });
      },
      form
    );
  },
};
