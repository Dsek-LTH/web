import { policyAccessGuard, withAccess } from "$lib/utils/access";
import apiNames from "$lib/utils/apiNames";
import prisma from "$lib/utils/prisma";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ parent, params }) => {
  const doorAccessPolicies = await prisma.doorAccessPolicy.findMany({
    where: {
      doorName: params.slug,
    },
    include: {
      member: true,
    },
  });
  const { accessPolicies } = await parent();
  policyAccessGuard(apiNames.DOOR.READ, accessPolicies);
  return {
    doorAccessPolicies,
  };
};

export const actions = {
  delete: async ({ request, locals }) => {
    const session = await locals.getSession();
    return withAccess(apiNames.DOOR.DELETE, session?.user, async () => {
      const data = await request.formData();
      const id = data.get("id");
      if (typeof id !== "string") {
        return {
          success: false,
          missing: true,
        };
      }
      try {
        await prisma.doorAccessPolicy.delete({
          where: { id },
        });
        return {
          success: true,
        };
      } catch (e) {
        return {
          success: false,
          error: "message" in (e as Error) ? e.message : "Unknown error",
        };
      }
    });
  },
};
