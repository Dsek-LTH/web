import prisma from "$lib/utils/prisma";
import { error, fail } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { ctxAccessGuard } from "$lib/utils/access";
import apiNames from "$lib/utils/apiNames";
import { Prisma } from "@prisma/client";
import { _classProgrammes } from "./data";

export const load: PageServerLoad = async ({ params }) => {
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
  return {
    member: memberResult.value,
    publishedArticles: publishedArticlesResult.value ?? [],
  };
};

export const actions = {
  update: async ({ params, locals, request }) => {
    const session = await locals.getSession();
    await ctxAccessGuard(apiNames.MEMBER.UPDATE, session?.user, { studentId: params.studentId });
    const studentId = params.studentId;
    const formData = await request.formData();
    const classProgramme = (formData.get("classProgramme") as string | null) ?? undefined;
    if (classProgramme && !_classProgrammes.some((p) => p.id === classProgramme))
      return fail(400, {
        error: "Invalid class programme",
        data: Object.fromEntries(formData),
      });
    const classYear = (formData.get("classYear") as string | null) ?? undefined;

    if (
      !classYear ||
      typeof classYear !== "string" ||
      Number.isNaN(Number(classYear)) ||
      Number(classYear) < 1982 ||
      Number(classYear) > new Date().getFullYear()
    )
      return fail(400, {
        error: "Invalid class year",
        data: Object.fromEntries(formData),
      });
    try {
      await prisma.member.update({
        where: { studentId },
        data: {
          firstName: (formData.get("firstName") as string | null) ?? undefined,
          nickname: (formData.get("nickname") as string | null) ?? undefined,
          lastName: (formData.get("lastName") as string | null) ?? undefined,
          classProgramme,
          classYear: Number(classYear),
          foodPreference: (formData.get("foodPreference") as string | null) ?? undefined,
        },
      });
      return {
        success: true,
        data: Object.fromEntries(formData),
      };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === "P2025" || e.code === "2016") {
          return fail(404, { error: "Member not found", data: Object.fromEntries(formData) });
        }
        return fail(500, {
          error: e.message ?? "Unknown error",
          data: Object.fromEntries(formData),
        });
      }
    }
  },
};
