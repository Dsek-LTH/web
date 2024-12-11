import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals, params }) => {
  const { prisma } = locals;
  const openElections = await prisma.election.findMany({
    orderBy: [
      {
        expiresAt: "asc",
      },
    ],
    where: {
      expiresAt: {
        gte: new Date(),
      },
    },
    select: {
      markdown: true,
      markdownEn: true,
      link: true,
      expiresAt: true,
      committee: true,
      id: true,
    },
  });

  const committees = await prisma.committee.findMany({
    orderBy: [
      {
        name: "asc",
      },
    ],
    select: {
      id: true,
      name: true,
      nameEn: true,
    },
  });

  return {
    openElections,
    committees,
  };
};
