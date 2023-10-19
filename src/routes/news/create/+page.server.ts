import { policyAccessGuard, withAccess } from "$lib/utils/access";
import apiNames from "$lib/utils/apiNames";
import prisma from "$lib/utils/prisma";
import { Prisma, type Tag } from "@prisma/client";
import { error, fail, redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { slugifyArticleHeader } from "$lib/utils/slugify";
import { getArticleAuthorOptions, type AuthorOption } from "../utils/articles";

export const load: PageServerLoad = async ({ parent }) => {
  const allTags = await prisma.tag.findMany();
  const { session, accessPolicies } = await parent();
  policyAccessGuard(apiNames.NEWS.CREATE, accessPolicies);
  const currentMemberWithMandates = await prisma.member.findUnique({
    where: {
      studentId: session?.user.student_id,
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
  if (!currentMemberWithMandates) throw error(500, "Member not found");
  const authorOptions = getArticleAuthorOptions(currentMemberWithMandates);
  return {
    allTags,
    authorOptions,
  };
};

export const actions = {
  default: async ({ request, locals }) => {
    const session = await locals.getSession();
    return withAccess(apiNames.NEWS.CREATE, session?.user, async () => {
      // read the form data sent by the browser
      const formData = await request.formData();
      const header = String(formData.get("header"));
      // const image = formData.get("image");
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
      if (!header)
        return fail(400, {
          error: "Missing header",
          data: Object.fromEntries(formData),
        });
      const existingAuthor = await prisma.author.findFirst({
        where: {
          member: {
            studentId: session!.user.student_id,
          },
          mandateId: author.mandateId,
        },
      });
      try {
        await prisma.article.create({
          data: {
            slug: await slugifyArticleHeader(header),
            header: header,
            body: String(formData.get("body")) ?? "",
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
            // imageUrl: (image as string | undefined) || null,
            tags: {
              connect: tags
                .filter((tag) => !!tag)
                .map((tag) => ({
                  id: tag.id,
                })),
            },
            publishedAt: new Date(),
          },
        });
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
      throw redirect(303, "/news");
    });
  },
};
