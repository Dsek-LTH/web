import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  const { prisma } = locals;
  const openElectionsPromise = prisma.election.findMany({
    orderBy: [{ expiresAt: "asc" }],
    where: { expiresAt: { gte: new Date() } },
    select: {
      markdown: true,
      markdownSv: true,
      markdownEn: true,
      link: true,
      expiresAt: true,
      committee: true,
      id: true,
    },
  });

  const committeesPromise = prisma.committee.findMany({
    orderBy: [{ nameSv: "asc" }],
    select: {
      id: true,
      nameSv: true,
      nameEn: true,
    },
  });

  return {
    openElections: await openElectionsPromise,
    committees: await committeesPromise,
  };
};
