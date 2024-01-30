import translated from "$lib/utils/translated";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  const { prisma } = locals;
  const committees = await prisma.committee
    .findMany({
      include: {
        positions: {
          where: {
            active: true,
          },
          select: {
            mandates: {
              where: {
                startDate: {
                  lte: new Date(),
                },
                endDate: {
                  gte: new Date(),
                },
              },
              select: {
                memberId: true,
              },
            },
          },
          orderBy: {
            name: "asc",
          },
        },
      },
    })
    .then(translated);

  return {
    committees,
  };
};
