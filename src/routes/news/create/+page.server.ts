import { policyAccessGuard, withAccess } from "$lib/utils/access";
import apiNames from "$lib/utils/apiNames";
import prisma from "$lib/utils/prisma";
import { slugifyArticleHeader } from "$lib/utils/slugify";
import { error, fail, type Actions } from "@sveltejs/kit";
import { message, superValidate } from "sveltekit-superforms/client";
import { getArticleAuthorOptions } from "../articles";
import { articleSchema } from "../schema";
import type { PageServerLoad } from "./$types";

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
  const authorOptions = await getArticleAuthorOptions(currentMemberWithMandates);
  return {
    allTags,
    authorOptions,
    form: superValidate(
      {
        header: "",
        body: "",
        author: authorOptions[0],
        tags: [],
      },
      articleSchema
    ),
  };
};

export const actions = {
  default: async ({ request, locals }) => {
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
        await prisma.article.create({
          data: {
            slug: await slugifyArticleHeader(header),
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
        return message(form, {
          message: "Nyhet skapad",
          type: "success",
        });
      },
      form
    );
  },
} satisfies Actions;
