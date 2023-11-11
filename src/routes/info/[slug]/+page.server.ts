import type { PageServerLoad } from "../$types";
import prisma from "$lib/utils/prisma";
import { error } from "@sveltejs/kit";

export const load: PageServerLoad = async ({ params }) => {
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
  return { markdown: markdownPage, slug: params.slug };
};
