import { policyAccessGuard, withAccess } from "$lib/access";
import apiNames from "$lib/apiNames";
import prisma from "$lib/prisma";
import { Prisma, type Tag } from "@prisma/client";
import { error, fail, redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ parent, params }) => {
  const allTags = await prisma.tag.findMany();
  const { accessPolicies } = await parent();
  policyAccessGuard(apiNames.NEWS.UPDATE, accessPolicies);
  const event = await prisma.event.findUnique({
    where: {
      slug: params.slug,
    },
    include: {
      author: true,
      tags: true,
    },
  });
  if (!event) throw error(404, "Article not found");
  return {
    allTags,
    author: event.author,
    event,
  };
};

export const actions = {
  default: async ({ request, locals }) => {
    const session = await locals.getSession();
    return withAccess(apiNames.NEWS.UPDATE, session?.user, async () => {
      // read the form data sent by the browser
      const formData = await request.formData();
      let tags: Tag[];
      try {
        tags = JSON.parse(String(formData.get("tags")));
      } catch (e) {
        return fail(400, {
          error: "Invalid tags",
          data: Object.fromEntries(formData),
        });
      }
      let slug: string;
      try {
        const result = await prisma.event.update({
          where: {
            slug: String(formData.get("slug")),
          },
          data: {
            title: String(formData.get("title")),
            shortDescription: String(formData.get("shortDescription")),
            description: String(formData.get("description")),
            tags: {
              connect: tags
                .filter((tag) => !!tag)
                .map((tag) => ({
                  id: tag.id,
                })),
            },
            startDatetime: formData.get("startDatetime")
              ? new Date(String(formData.get("startDatetime")))
              : new Date(),
            endDatetime: formData.get("endDatetime")
              ? new Date(String(formData.get("endDatetime")))
              : new Date(),
            location: String(formData.get("location")) ?? null,
            organizer: String(formData.get("organizer")) ?? "",
            link: String(formData.get("link")) ?? null,
          },
        });
        slug = result.slug!;
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError) {
          return fail(400, {
            error: e.message,
            data: Object.fromEntries(formData),
          });
        }
        console.log(e);
        return fail(500, {
          error: "Unknown error",
          data: Object.fromEntries(formData),
        });
      }
      throw redirect(303, `/events/${slug}`);
    });
  },
};
