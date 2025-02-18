import { getAllDbay } from "$lib/dbay/dbay";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  const { prisma } = locals;
  const dbay = await getAllDbay(prisma);
  return { dbay };
};
