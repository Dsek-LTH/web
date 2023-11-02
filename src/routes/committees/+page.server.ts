import prisma from "$lib/utils/prisma";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
  const committees = await prisma.committee.findMany({
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
  });

  return {
    committees,
  };
};
