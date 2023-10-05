import { getAllArticles } from "$lib/articles";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
  const articles = await getAllArticles();
  return {
    articles
  };
};
