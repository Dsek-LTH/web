import { getArticle } from "$lib/articles";
import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params }) => {
  const article = await getArticle(params.slug);
  if (article == undefined) {
    throw error(404, {
      message: "Not found",
    });
  }
  return {
    article,
  };
};
