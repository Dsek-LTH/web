import { policyAccessGuard, withAccess } from "$lib/access";
import apiNames from "$lib/apiNames";
import prisma from "$lib/prisma";
import { fail } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { Prisma } from "@prisma/client";

export const load: PageServerLoad = async ({ parent, params }) => {
  const policies = await prisma.accessPolicy.findMany({
    where: {
      apiName: params.apiName,
    },
    include: {
      member: true,
    },
  }); // fetch it immidiately to reduce waterfall delay
  const { accessPolicies } = await parent();
  policyAccessGuard(apiNames.ACCESS_POLICY.READ, accessPolicies);
  return {
    policies,
  };
};

export const actions = {
  create: async ({ params, request, locals }) => {
    const session = await locals.getSession();
    return withAccess(apiNames.ACCESS_POLICY.CREATE, session?.user, async () => {
      const data = await request.formData();
      const role = data.get("role");
      const studentId = data.get("studentId");
      if (typeof role !== "string" && typeof studentId !== "string") {
        return fail(400, { role, studentId, missing: true });
      }
      try {
        await prisma.accessPolicy.create({
          data: {
            apiName: params.apiName,
            role: role ? (role as string | undefined) : undefined,
            studentId: studentId ? (studentId as string | undefined) : undefined,
          },
        });
        return {
          success: true,
        };
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError) {
          return fail(400, { role, studentId, error: e.message });
        }
        return fail(400, { role, studentId, error: "Unknown error" });
      }
    });
  },
  delete: async ({ request, locals }) => {
    const session = await locals.getSession();
    return withAccess(apiNames.ACCESS_POLICY.DELETE, session?.user, async () => {
      const data = await request.formData();
      const id = data.get("id");
      if (typeof id !== "string" || id === undefined) {
        return fail(400, { id, missing: true });
      }
      try {
        await prisma.accessPolicy.delete({
          where: {
            id,
          },
        });
        return {
          success: true,
        };
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError) {
          // foreign key constraint
          if (e.code === "P2003") return fail(400, { id, error: "Member does not exist" });
          return fail(400, { id, error: e.message });
        }
        return fail(500, { id, error: "Unknown error" });
      }
    });
  },
};
