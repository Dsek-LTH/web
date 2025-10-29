import apiNames from "$lib/utils/apiNames";
import { authorize } from "$lib/utils/authorization";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  const { prisma, user } = locals;

  const items = await prisma.drinkItemBatch.findMany({
    include: { item: true },
  });
  return { items };
};
