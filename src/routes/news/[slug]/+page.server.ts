import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { getArticle } from "../articles";

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
