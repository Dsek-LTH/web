import { Prisma } from "@prisma/client";
import { fail, redirect } from "@sveltejs/kit";
import prisma from "$lib/utils/prisma";
import { policyAccessGuard, withAccess } from "$lib/utils/access";
import apiNames from "$lib/utils/apiNames";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ parent, params }) => {
  const markdownPage = await prisma.markdown.findUnique({
    where: {
      name: params.slug,
    },
  });
  const { accessPolicies } = await parent();
  if (markdownPage == undefined) {
    policyAccessGuard(apiNames.MARKDOWNS.CREATE, accessPolicies);
  } else {
    policyAccessGuard(apiNames.MARKDOWNS.PAGE(params.slug).UPDATE, accessPolicies);
  }

  return { markdown: markdownPage, slug: params.slug };
};

export const actions = {
  create: async ({ request, locals }) => {
    const formData = await request.formData();
    const name = String(formData.get("name"));
    const markdownContent = String(formData.get("markdown"));
    const session = await locals.getSession();
    return withAccess(apiNames.MARKDOWNS.CREATE, session?.user, async () => {
      try {
        await prisma.markdown.create({
          data: {
            name: name,
            markdown: markdownContent,
          },
        });
        await prisma.accessPolicy.create({
          data: {
            apiName: apiNames.MARKDOWNS.PAGE(name).UPDATE,
            studentId: session?.user?.student_id,
          },
        });
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError) {
          return fail(400, {
            error: e.message,
            data: Object.fromEntries(formData),
          });
        }
        return fail(500, {
          error: "Unknown error",
          data: Object.fromEntries(formData),
        });
      }
      throw redirect(303, `/info/${name}`);
    });
  },
  update: async ({ request, locals }) => {
    const formData = await request.formData();
    const name = String(formData.get("name"));
    const markdownContent = String(formData.get("markdown"));
    const session = await locals.getSession();
    return withAccess(apiNames.MARKDOWNS.PAGE(name).UPDATE, session?.user, async () => {
      try {
        await prisma.markdown.update({
          where: {
            name: name,
          },
          data: {
            markdown: markdownContent,
          },
        });
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError) {
          return fail(400, {
            error: e.message,
            data: Object.fromEntries(formData),
          });
        }
        return fail(500, {
          error: "Unknown error",
          data: Object.fromEntries(formData),
        });
      }
      throw redirect(303, `/info/${name}`);
    });
  },
};
