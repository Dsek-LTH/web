import { fail } from "@sveltejs/kit";
import { redirect } from "sveltekit-flash-message/server";
import { superValidate } from "sveltekit-superforms/server";
import { eventSchema } from "../schema";
import type { Actions, PageServerLoad } from "./$types";
import { slugWithCount, slugify } from "$lib/utils/slugify";

export const load: PageServerLoad = async ({ locals, parent }) => {
  const { prisma } = locals;
  const allTags = await prisma.tag.findMany();
  const { member } = await parent();
  return {
    allTags,
    form: await superValidate(
      { organizer: `${member!.firstName} ${member!.lastName}` },
      eventSchema,
    ),
  };
};
export const actions: Actions = {
  default: async (event) => {
    const { request, locals } = event;
    const { prisma, user } = locals;
    const form = await superValidate(request, eventSchema);
    if (!form.valid) return fail(400, { form });
    const slug = slugify(form.data.title);
    const slugCount = await prisma.event.count({
      where: {
        slug: {
          startsWith: slug,
        },
      },
    });
    const result = await prisma.event.create({
      data: {
        slug: slugWithCount(slug, slugCount),
        ...form.data,
        author: {
          connect: {
            studentId: user?.studentId,
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
      `/events/${result.slug}`,
      {
        message: "Evenemang skapat",
        type: "success",
      },
      event,
    );
  },
};
