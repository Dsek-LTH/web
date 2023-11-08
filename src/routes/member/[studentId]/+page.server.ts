import prisma from "$lib/utils/prisma";
import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params }) => {
  const [member, publishedArticles] = await Promise.all([
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
      },
      orderBy: {
        publishedAt: "desc",
      },
      take: 5,
    }),
  ]);
  if (!member) {
    throw error(404, "Member not found");
  }
  return {
    member,
    publishedArticles,
  };
};
