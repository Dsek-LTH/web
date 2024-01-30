import prisma from "$lib/utils/prisma";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  const session = await locals.getSession();
  const myInventory = await prisma.userInventory.findFirst({
    where: {
      studentId: session?.user?.student_id,
    },
    include: {
      userInventoryItems: true,
    },
  });
  return {
    myInventory,
  };
};
