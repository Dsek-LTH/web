import { withAccess } from "$lib/utils/access";
import apiNames from "$lib/utils/apiNames";
import prisma from "$lib/utils/prisma";
import { memberSchema } from "$lib/zod/schemas";
import { error, fail } from "@sveltejs/kit";
import { message, superValidate } from "sveltekit-superforms/server";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params, parent }) => {
  const { currentMember } = await parent();
  let secretCode: string | null = null;
  if (currentMember?.studentId === params.studentId) {
    const discordMember = await prisma.discordMember.findFirst({
      where: {
        memberId: currentMember.id,
      },
    });
    if (discordMember) {
      secretCode = discordMember.secretCode;
    }
  }
  const [memberResult, publishedArticlesResult] = await Promise.allSettled([
    prisma.member.findUnique({
      where: {
        studentId: params.studentId,
      },
      include: {
        mandates: {
          include: {
            position: {
              include: {
                committee: {
                  select: {
                    name: true,
                    imageUrl: true,
                  },
                },
              },
            },
          },
        },
        authoredEvents: {
          orderBy: {
            startDatetime: "desc",
          },
          take: 5,
        },
      },
    }),
    prisma.article.findMany({
      where: {
        author: {
          member: {
            studentId: params.studentId,
          },
        },
        removedAt: null,
      },
      orderBy: {
        publishedAt: "desc",
      },
      take: 5,
    }),
  ]);
  if (memberResult.status === "rejected") {
    throw error(500, "Could not fetch member");
  }
  if (publishedArticlesResult.status === "rejected") {
    throw error(500, "Could not fetch articles");
  }
  if (!memberResult.value) {
    throw error(404, "Member not found");
  }
  const member = memberResult.value;
  return {
    form: await superValidate(member, memberSchema),
    member,
    secretCode,
    publishedArticles: publishedArticlesResult.value ?? [],
  };
};

const updateSchema = memberSchema.pick({
  firstName: true,
  lastName: true,
  nickname: true,
  foodPreference: true,
  classProgramme: true,
  classYear: true,
});

export type UpdateSchema = typeof updateSchema;

export const actions = {
  update: async ({ params, locals, request }) => {
    const form = await superValidate(request, updateSchema);
    if (!form.valid) return fail(400, { form });
    const session = await locals.getSession();
    const { studentId } = params;
    return withAccess(
      apiNames.MEMBER.UPDATE,
      session?.user,
      async () => {
        await prisma.member.update({
          where: { studentId },
          data: {
            ...form.data,
          },
        });
        return message(form, {
          message: "Medlem uppdaterad",
          type: "success",
        });
      },
      form,
      { studentId }
    );
  },
};
