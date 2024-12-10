import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  const { prisma } = locals;
  let date = new Date();
  date.setDate(date.getDate() - 1);
  const openElections = await prisma.election.findMany({
    orderBy: [
      {
        expiresAt: "asc",
      },
    ],
    where: {
      expiresAt: {
        gte: date,
      },
    },
    select: {
      markdown: true,
      markdownEn: true,
      link: true,
      expiresAt: true,
      committee: true,
    },
  });

  return {
    openElections,
  };
};
