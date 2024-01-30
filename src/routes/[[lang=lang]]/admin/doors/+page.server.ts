import { policyAccessGuard } from "$lib/utils/access";
import apiNames from "$lib/utils/apiNames";
import prisma from "$lib/utils/prisma";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ parent }) => {
  const doors = await prisma.door.findMany();
  const { accessPolicies } = await parent();
  policyAccessGuard(apiNames.DOOR.READ, accessPolicies);
  return {
    doors,
  };
};
