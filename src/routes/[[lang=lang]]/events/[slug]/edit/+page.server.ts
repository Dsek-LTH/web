import { policyAccessGuard, withAccess } from "$lib/utils/access";
import apiNames from "$lib/utils/apiNames";
import prisma from "$lib/utils/prisma";
import { error, fail } from "@sveltejs/kit";
import { redirect } from "sveltekit-flash-message/server";
import { superValidate } from "sveltekit-superforms/server";
import { eventSchema } from "../../schema";
import type { PageServerLoad } from "./$types";
import { isUUIDRegex } from "$lib/utils/generateUUID";

export const load: PageServerLoad = async ({ parent, params }) => {
  const allTags = await prisma.tag.findMany();
  const { accessPolicies } = await parent();
  policyAccessGuard(apiNames.NEWS.UPDATE, accessPolicies);
  const event = await prisma.event.findUnique({
    where: isUUIDRegex.test(params.slug)
      ? {
          id: params.slug,
        }
      : {
          slug: params.slug,
        },
    include: {
      author: true,
      tags: true,
    },
  });
  if (!event) {
    throw error(404, "Article not found");
  }
  return {
    allTags,
    author: event.author,
    event,
    form: await superValidate(event, eventSchema),
  };
};

export const actions = {
  default: async (event) => {
    const { request, locals, params } = event;
    const form = await superValidate(request, eventSchema);
    if (!form.valid) return fail(400, { form });
    const session = await locals.getSession();
    return withAccess(
      apiNames.EVENT.UPDATE,
      session?.user,
      async () => {
        const existingEvent = await prisma.event.findUnique({
          where: isUUIDRegex.test(params.slug)
            ? {
                id: params.slug,
              }
            : {
                slug: params.slug,
              },
          select: { id: true },
        });
        if (!existingEvent) {
          throw error(404, "Event not found");
        }
        await prisma.event.update({
          where: {
            id: existingEvent.id,
          },
          data: {
            ...form.data,
            author: undefined,
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
          `/event/${params.slug}`,
          {
            message: "Evenemang uppdaterat",
            type: "success",
          },
          event,
        );
      },
      form,
    );
  },
};
