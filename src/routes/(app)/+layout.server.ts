export const load = async ({ locals }) => {
  const { prisma } = locals;
  const alerts = await prisma.alert.findMany({
    where: {
      removedAt: null,
    },
  });
  return { alerts };
};
