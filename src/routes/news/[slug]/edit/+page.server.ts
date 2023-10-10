import { accessGuard, withAccess } from "$lib/access";
import apiNames from "$lib/apiNames";
import prisma from "$lib/prisma";
import { Prisma, type Member, type Tag } from "@prisma/client";
import { error, fail, redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { slugify, slugifyArticleHeader } from "$lib/slugify";

export type AuthorOption = {
  memberId: string;
  member: Member;
  mandateId: string | null;
  mandate: Prisma.MandateGetPayload<{
    include: {
      position: true;
    };
  }> | null;
};
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
          member: true,
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

  const authorMemberWithMandates = await prisma.member.findUnique({
    where: {
      id: article?.author.member.id,
    },
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
  });
  if (!authorMemberWithMandates) throw error(500, "Author member not found");
  const authorOptions: AuthorOption[] = [
    {
      memberId: authorMemberWithMandates.id,
      member: authorMemberWithMandates,
      mandateId: null,
      mandate: null,
    },
    ...(authorMemberWithMandates?.mandates.map((mandate) => {
      return {
        memberId: authorMemberWithMandates.id,
        member: authorMemberWithMandates,
        mandateId: mandate.id,
        mandate: mandate,
      };
    }) ?? []),
  ];
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
          });
        }
      } catch (e) {
        return fail(400, {
          error: "Invalid author or tags",
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
      const slug = String(formData.get("slug"));
      const newSlug =
        slugify(String(formData.get("header"))) === slug
          ? slug
          : slugifyArticleHeader(String(formData.get("header")));
      try {
        await prisma.article.update({
          where: {
            slug,
          },
          data: {
            slug: newSlug,
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
              connect: tags
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
          return fail(400, {
            error: e.message,
          });
        }
        console.log(e);
        return fail(500, {
          error: "Unknown error",
        });
      }
      throw redirect(303, `/news/${newSlug}`);
    });
  },
};
