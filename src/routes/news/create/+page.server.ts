import { accessGuard, withAccess } from "$lib/access";
import apiNames from "$lib/apiNames";
import prisma from "$lib/prisma";
import { Prisma, type Member, type Tag } from "@prisma/client";
import { error, fail, redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

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
export const load: PageServerLoad = async ({ parent }) => {
  const allTags = await prisma.tag.findMany();
  const { session, accessPolicies } = await parent();
  accessGuard(apiNames.NEWS.CREATE, accessPolicies);
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
  const authorOptions: AuthorOption[] = [
    {
      memberId: currentMemberWithMandates.id,
      member: currentMemberWithMandates,
      mandateId: null,
      mandate: null,
    },
    ...(currentMemberWithMandates?.mandates.map((mandate) => {
      return {
        memberId: currentMemberWithMandates.id,
        member: currentMemberWithMandates,
        mandateId: mandate.id,
        mandate: mandate,
      };
    }) ?? []),
  ];
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
      const body = String(formData.get("body"));
      // const image = formData.get("image");
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
      if (!header)
        return fail(400, {
          error: "Missing header",
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
            slug: (header as string).replace(/\s+/g, "-").toLowerCase(),
            header: header as string,
            body: (body as string | undefined) ?? "",
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
          });
        }
        console.log(e);
        return fail(500, {
          error: "Unknown error",
        });
      }
      throw redirect(303, "/news");
    });
  },
};
