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
  create: async ({ request, locals, params }) => {
    const session = await locals.getSession();
    return withAccess(apiNames.DOOR.UPDATE, session?.user, async () => {
      const data = await request.formData();
      const doorName = params.slug;
      const memberId = data.get("member");
      const role = data.get("role");
      const start = data.get("startDatetime");
      const end = data.get("endDatetime");
      console.log(start, end);

      try {
        await prisma.doorAccessPolicy.create({
          data: {
            doorName,
            studentId: memberId && typeof memberId === "string" ? memberId : undefined,
            role: role && typeof role === "string" ? role : undefined,
            startDatetime: start && typeof start === "string" ? new Date(start) : undefined,
            endDatetime: end && typeof end === "string" ? new Date(end) : undefined,
          },
        });
        return {
          success: true,
        };
      } catch (e) {
        return {
          success: false,
          error: "message" in (e as Error) ? (e as Error).message : "Unknown error",
        };
      }
    });
  },
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
          error: "message" in (e as Error) ? (e as Error).message : "Unknown error",
        };
      }
    });
  },
};
