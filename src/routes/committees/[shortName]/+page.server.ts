import prisma from "$lib/utils/prisma";
import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params }) => {
  const committee = await prisma.committee.findUnique({
    where: {
      shortName: params.shortName,
    },
    include: {
      positions: {
        where: {
          active: true,
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
              member: true,
            },
          },
          emailAliases: {
            select: {
              email: true,
            },
          },
        },
        orderBy: {
          name: "asc",
        },
      },
    },
  });
  if (!committee) {
    throw error(404, "Committee not found");
  }
  return {
    committee,
    positions: committee.positions,
  };
};
