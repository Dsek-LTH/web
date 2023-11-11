import prisma from "$lib/utils/prisma";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
  const numberOfUniqueVolunteers = await prisma.member.count({
    where: {
      mandates: {
        some: {
          startDate: {
            lte: new Date(),
          },
          endDate: {
            gte: new Date(),
          },
        },
      },
    },
  });
  const numberOfMandates = await prisma.mandate.count({
    where: {
      startDate: {
        lte: new Date(),
      },
      endDate: {
        gte: new Date(),
      },
    },
  });

  return {
    numberOfUniqueVolunteers,
    numberOfMandates,
  };
};
