import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  const { prisma } = locals;
  const openElections = await prisma.election.findMany({
    orderBy: [{ expiresAt: "asc" }],
    where: { expiresAt: { gte: new Date() } },
    include: {
      committee: true,
    },
  });

  return {
    openElections,
  };
};
