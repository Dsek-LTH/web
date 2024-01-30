import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import translated from "$lib/utils/translated";

export const load: PageServerLoad = async ({ locals, params }) => {
  const { prisma } = locals;
  const markdownPage = await prisma.markdown
    .findUnique({
      where: {
        name: params.slug,
      },
    })
    .then(translated);
  if (markdownPage == undefined) {
    throw error(404, {
      message: "Not found",
    });
  }
  return { markdown: markdownPage, slug: params.slug };
};
