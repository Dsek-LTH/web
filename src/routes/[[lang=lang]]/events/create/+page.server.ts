import { policyAccessGuard, withAccess } from "$lib/utils/access";
import apiNames from "$lib/utils/apiNames";
import prisma from "$lib/utils/prisma";
import { slugifyArticleHeader } from "$lib/utils/slugify";
import { fail } from "@sveltejs/kit";
import { redirect } from "sveltekit-flash-message/server";
import { superValidate } from "sveltekit-superforms/server";
import { eventSchema } from "../schema";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ parent }) => {
  const allTags = await prisma.tag.findMany();
  const { accessPolicies, currentMember } = await parent();
  policyAccessGuard(apiNames.EVENT.CREATE, accessPolicies);
  return {
    allTags,
    form: await superValidate(
      { organizer: `${currentMember!.firstName} ${currentMember!.lastName}` },
      eventSchema,
    ),
  };
};
export const actions: Actions = {
  default: async (event) => {
    const form = await superValidate(event.request, eventSchema);
    if (!form.valid) return fail(400, { form });
    const session = await event.locals.getSession();
    return withAccess(
      apiNames.EVENT.CREATE,
      session?.user,
      async () => {
        const result = await prisma.event.create({
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
        throw redirect(
          `/event/${result.slug}`,
          {
            message: "Evenemang skapat",
            type: "success",
          },
          event,
        );
      },
      form,
    );
  },
};
