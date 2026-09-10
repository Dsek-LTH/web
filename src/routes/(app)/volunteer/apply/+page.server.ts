import type { PageServerLoad } from "./$types";

/**
 * Same query as /elections — the guide surfaces the currently open elections
 * inline so a new student doesn't have to know that page exists.
 */
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
