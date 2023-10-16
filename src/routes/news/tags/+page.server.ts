import { ctxAccessGuard, policyAccessGuard } from "$lib/access";
import apiNames from "$lib/apiNames";
import prisma from "$lib/prisma";
import { fail } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ parent }) => {
  const tags = await prisma.tag.findMany({ orderBy: { name: "asc" } });
  const { accessPolicies } = await parent();
  policyAccessGuard(apiNames.NEWS.MANAGE_TAGS, accessPolicies);
  return {
    tags,
  };
};

export const actions = {
  create: async ({ request, locals }) => {
    const session = await locals.getSession();
    await ctxAccessGuard(apiNames.NEWS.MANAGE_TAGS, session?.user);
    const formData = await request.formData();
    const name = String(formData.get("name"));
    if (!name) return { data: Object.fromEntries(formData), error: "Name is required" };
    try {
      await prisma.tag.create({
        data: {
          name,
        },
      });
    } catch (e) {
      return fail(400, {
        data: Object.fromEntries(formData),
        error: (e as any).message ?? "Unknown error",
      });
    }
    return {
      success: true,
    };
  },
  update: async ({ request, locals }) => {
    const session = await locals.getSession();
    await ctxAccessGuard(apiNames.NEWS.MANAGE_TAGS, session?.user);
    const formData = await request.formData();
    try {
      await prisma.tag.update({
        where: {
          id: String(formData.get("id")),
        },
        data: {
          name: String(formData.get("name")) || "",
        },
      });
    } catch (e) {
      return fail(400, {
        data: Object.fromEntries(formData),
        error: (e as any).message ?? "Unknown error",
      });
    }
    return {
      success: true,
    };
  },
};
