export const load = async ({ locals }) => {
  const { prisma } = locals;
  const [vordf, ordf, nara] = await Promise.all([
    prisma.mandate.findFirst({
      where: {
        AND: [
          { positionId: "dsek.vice_ordf" },
          { startDate: { lte: new Date() } },
          { endDate: { gte: new Date() } },
        ],
      },
      include: {
        member: true,
        position: true,
      },
    }),
    prisma.mandate.findFirst({
      where: {
        AND: [
          { positionId: "dsek.ordf" },
          { startDate: { lte: new Date() } },
          { endDate: { gte: new Date() } },
        ],
      },
      include: {
        member: true,
        position: true,
      },
    }),
    prisma.mandate.findFirst({
      where: {
        AND: [
          { positionId: "dsek.nari.mastare" },
          { startDate: { lte: new Date() } },
          { endDate: { gte: new Date() } },
        ],
      },
      include: {
        member: true,
        position: true,
      },
    }),
  ]);

  return { vordf, ordf, nara };
};
