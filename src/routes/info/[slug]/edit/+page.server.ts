import { Prisma } from "@prisma/client";
import { error, fail, redirect } from "@sveltejs/kit";
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
  if (markdownPage == undefined) {
    throw error(404, {
      message: "Not found",
    });
  }
  const { accessPolicies } = await parent();
  policyAccessGuard(apiNames.MARKDOWN(params.slug).UPDATE, accessPolicies);
  return { markdown: markdownPage, slug: params.slug };
};

export const actions = {
  default: async ({ request, locals }) => {
    // read the form data sent by the browser
    const formData = await request.formData();
    const name = String(formData.get("name"));
    const session = await locals.getSession();
    return withAccess(apiNames.MARKDOWN(name).UPDATE, session?.user, async () => {
      try {
        await prisma.markdown.update({
          where: {
            name: name,
          },
          data: {
            markdown: String(formData.get("markdown")),
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
