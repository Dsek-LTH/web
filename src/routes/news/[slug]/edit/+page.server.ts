import { accessGuard, withAccess } from "$lib/access";
import apiNames from "$lib/apiNames";
import { getArticleAuthorOptions, type AuthorOption } from "$lib/articles";
import prisma from "$lib/prisma";
import { Prisma, type Tag } from "@prisma/client";
import { error, fail, redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ parent, params }) => {
  const allTags = await prisma.tag.findMany();
  const { accessPolicies } = await parent();
  accessGuard(apiNames.NEWS.UPDATE, accessPolicies);
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
                  start: {
                    lte: new Date(),
                  },
                  end: {
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
        },
      },
      tags: true,
    },
  });
  if (article?.author.id !== undefined) article.author.id = "";
  if (!article) throw error(404, "Article not found");

  const authorMemberWithMandates = article.author.member;
  if (!authorMemberWithMandates) throw error(500, "Author member not found");
  const authorOptions = getArticleAuthorOptions(authorMemberWithMandates);

  article.author =
    (authorOptions.find(
      (option) =>
        option.memberId == article.author.memberId && option.mandateId == article.author.mandateId
    ) as typeof article.author) ?? article.author;
  return {
    allTags,
    authorOptions,
    article,
  };
};

export const actions = {
  default: async ({ request, locals }) => {
    const session = await locals.getSession();
    return withAccess(apiNames.NEWS.UPDATE, session?.user, async () => {
      // read the form data sent by the browser
      const formData = await request.formData();
      let author: AuthorOption;
      let tags: Tag[];
      try {
        author = JSON.parse(String(formData.get("author"))) as AuthorOption;
        tags = JSON.parse(String(formData.get("tags")));
        if (!author) {
          return fail(400, {
            error: "Missing author",
            data: Object.fromEntries(formData),
          });
        }
      } catch (e) {
        return fail(400, {
          error: "Invalid author or tags",
          data: Object.fromEntries(formData),
        });
      }
      const existingAuthor = await prisma.author.findFirst({
        where: {
          member: {
            id: author.memberId,
          },
          mandateId: author.mandateId,
        },
      });
      let slug: string;
      try {
        const result = await prisma.article.update({
          where: {
            slug: String(formData.get("slug")),
          },
          data: {
            header: String(formData.get("header")),
            body: String(formData.get("body")),
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
        slug = result.slug;
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError) {
          return fail(400, {
            error: e.message,
            data: Object.fromEntries(formData),
          });
        }
        console.log(e);
        return fail(500, {
          error: "Unknown error",
          data: Object.fromEntries(formData),
        });
      }
      throw redirect(303, `/news/${slug}`);
    });
  },
};
