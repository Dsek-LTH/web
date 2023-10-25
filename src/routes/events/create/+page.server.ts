import { policyAccessGuard, withAccess } from "$lib/utils/access";
import apiNames from "$lib/utils/apiNames";
import { getCurrentMember } from "$lib/utils/member";
import prisma from "$lib/utils/prisma";
import { slugifyArticleHeader } from "$lib/utils/slugify";
import { Prisma, type Tag } from "@prisma/client";
import { fail, redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ parent }) => {
  const allTags = await prisma.tag.findMany();
  const { session, accessPolicies } = await parent();
  policyAccessGuard(apiNames.EVENT.CREATE, accessPolicies);
  const member = await getCurrentMember(session?.user);
  return {
    allTags,
    author: member,
  };
};

export const actions = {
  default: async ({ request, locals }) => {
    const session = await locals.getSession();
    return withAccess(apiNames.EVENT.CREATE, session?.user, async () => {
      // read the form data sent by the browser
      const formData = await request.formData();
      console.log(formData);
      const title = String(formData.get("title"));
      // const image = formData.get("image");
      let tags: Tag[];
      try {
        tags = JSON.parse(String(formData.get("tags")));
      } catch (e) {
        return fail(400, {
          error: "Invalid tags",
          data: Object.fromEntries(formData),
        });
      }
      if (!title)
        return fail(400, {
          error: "Missing header",
          data: Object.fromEntries(formData),
        });
      try {
        await prisma.event.create({
          data: {
            slug: await slugifyArticleHeader(title),
            title: title,
            shortDescription: String(formData.get("shortDescription")) ?? "",
            description: String(formData.get("description")) ?? "",
            author: {
              connect: {
                studentId: session?.user?.student_id,
              },
            },
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
      throw redirect(303, "/events");
    });
  },
};
