import { policyAccessGuard, withAccess } from "$lib/utils/access";
import apiNames from "$lib/utils/apiNames";
import prisma from "$lib/utils/prisma";
import { slugifyArticleHeader } from "$lib/utils/slugify";
import { fail } from "@sveltejs/kit";
import { message, superValidate } from "sveltekit-superforms/server";
import { eventSchema } from "../schema";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ parent }) => {
  const allTags = await prisma.tag.findMany();
  const { accessPolicies, currentMember } = await parent();
  policyAccessGuard(apiNames.EVENT.CREATE, accessPolicies);
  return {
    allTags,
    form: await superValidate(
      { organizer: `${currentMember!.firstName} ${currentMember!.lastName}` },
      eventSchema
    ),
  };
};
export const actions = {
  default: async ({ request, locals }) => {
    const form = await superValidate(request, eventSchema);
    if (!form.valid) return fail(400, { form });
    const session = await locals.getSession();
    return withAccess(
      apiNames.EVENT.CREATE,
      session?.user,
      async () => {
        await prisma.event.create({
          data: {
            slug: await slugifyArticleHeader(form.data.title),
            ...form.data,
            author: {
              connect: {
                studentId: session?.user?.student_id,
              },
            },
            tags: {
              connect: form.data.tags
                .filter((tag) => !!tag)
                .map((tag) => ({
                  id: tag.id,
                })),
            },
          },
        });
        return message(form, {
          message: "Evenemang skapat",
          type: "success",
        });
      },
      form
    );
  },
};
