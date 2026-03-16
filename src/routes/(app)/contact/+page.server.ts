export const load = async ({ locals }) => {
  const { prisma } = locals;
  const [vordf, ordf, nara, pm, root, trivsel, cpu] = await Promise.all([
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
    prisma.mandate.findFirst({
      where: {
        AND: [
          { positionId: "dsek.cpu.mastare" },
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
          { positionId: "dsek.cpu.root" },
          { startDate: { lte: new Date() } },
          { endDate: { gte: new Date() } },
        ],
      },
      include: {
        member: true,
        position: true,
      },
    }),
    prisma.committee.findFirst({
      where: {
        shortName: "trivsel",
      },
      select: {
        darkImageUrl: true,
        lightImageUrl: true,
        monoImageUrl: true,
        nameSv: true,
        nameEn: true,
        name: true,
      },
    }),
    prisma.committee.findFirst({
      where: {
        shortName: "cpu",
      },
      select: {
        darkImageUrl: true,
        lightImageUrl: true,
        monoImageUrl: true,
        nameSv: true,
        nameEn: true,
        name: true,
      },
    }),
  ]);

  return { vordf, ordf, nara, pm, root, trivsel, cpu };
};
