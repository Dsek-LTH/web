import type { PageServerLoad } from "./$types";
import { getTotalInventoryValue } from "$lib/utils/getTotalInventoryValue";

export const load: PageServerLoad = async ({ locals }) => {
  const { prisma } = locals;

  const { totalInventoryValue, grouped } = await getTotalInventoryValue(prisma);

  return { totalInventoryValue, grouped };
};
