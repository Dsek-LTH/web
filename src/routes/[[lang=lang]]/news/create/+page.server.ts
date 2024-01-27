import { policyAccessGuard, withAccess } from "$lib/utils/access";
import apiNames from "$lib/utils/apiNames";
import { slugWithCount, slugify } from "$lib/utils/slugify";
import { error, fail } from "@sveltejs/kit";
import { redirect } from "sveltekit-flash-message/server";
import { superValidate } from "sveltekit-superforms/client";
import { getArticleAuthorOptions } from "../articles";
import { articleSchema } from "../schema";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals, parent }) => {
  const { prisma } = locals;
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
  });
  if (!currentMemberWithMandates) throw error(500, "Member not found");
  const authorOptions = await getArticleAuthorOptions(
    prisma,
    currentMemberWithMandates,
  );
  return {
    allTags,
    authorOptions,
    form: await superValidate(
      {
        author: authorOptions[0],
      },
      articleSchema,
    ),
  };
};

export const actions: Actions = {
  default: async (event) => {
    const { request, locals } = event;
    const { prisma } = locals;
    const form = await superValidate(request, articleSchema);
    if (!form.valid) return fail(400, { form });
    const session = await locals.getSession();
    return withAccess(
      apiNames.NEWS.CREATE,
      session?.user,
      async () => {
        const { header, body, author, tags } = form.data;
        const existingAuthor = await prisma.author.findFirst({
          where: {
            member: {
              studentId: session!.user.student_id,
            },
            mandateId: author.mandateId,
            customId: author.customId,
          },
        });
        const slug = slugify(header);
        const slugCount = await prisma.article.count({
          where: {
            slug: {
              startsWith: slug,
            },
          },
        });
        const result = await prisma.article.create({
          data: {
            slug: slugWithCount(slug, slugCount),
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
                    customAuthor: author.customId
                      ? { connect: { id: author.customId } }
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
        throw redirect(
          `/news/${result.slug}`,
          {
            message: "Nyhet skapad",
            type: "success",
          },
          event,
        );
      },
      form,
    );
  },
};
