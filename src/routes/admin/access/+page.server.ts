import { accessGuard, withAccess } from "$lib/access";
import apiNames from "$lib/apiNames";
import { fail } from "@sveltejs/kit";
import prisma from "$lib/prisma";
import { Prisma } from "@prisma/client";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ parent }) => {
  const allPolicies = await prisma.accessPolicy.findMany(); // fetch it immidiately to reduce waterfall delay
  const { accessPolicies } = await parent();
  accessGuard(apiNames.ACCESS_POLICY.READ, accessPolicies);
  return {
    allPolicies,
  };
};

export const actions = {
  create: async ({ locals, request }) => {
    const session = await locals.getSession();
    return withAccess(apiNames.ACCESS_POLICY.CREATE, session?.user, async () => {
      const data = await request.formData();
      const apiName = data.get("apiName");
      if (typeof apiName !== "string" || apiName.length === 0) {
        return fail(400, { apiName, missing: true });
      }
      try {
        await prisma.accessPolicy.create({
          data: {
            apiName,
            role: "*",
          },
        });
        return {
          success: true,
        };
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError) {
          return fail(400, { apiName, error: e.message });
        }
        console.warn(e);
        return fail(400, { apiName, error: "Unknown error" });
      }
    });
  },
};
