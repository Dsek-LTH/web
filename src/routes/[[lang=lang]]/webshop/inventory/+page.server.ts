import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  const { prisma, user } = locals;
  const myInventory = await prisma.userInventory.findFirst({
    where: {
      studentId: user?.studentId,
    },
    include: {
      userInventoryItems: true,
    },
  });
  return {
    myInventory,
  };
};
