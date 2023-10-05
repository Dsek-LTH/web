import { accessGuard } from "$lib/access";
import apiNames from "$lib/apiNames";
import prisma from "$lib/prisma";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ parent }) => {
  const allPolicies = await prisma.accessPolicy.findMany(); // fetch it immidiately to reduce waterfall delay
  const { accessPolicies } = await parent();
  accessGuard(apiNames.ACCESS_POLICY.READ, accessPolicies);
  return {
    allPolicies,
  };
};
