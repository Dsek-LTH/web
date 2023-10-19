import type { PageServerLoad } from "./$types";
import { getAllArticles } from "./utils/articles";

export const load: PageServerLoad = async () => {
  const articles = await getAllArticles();
  return {
    articles,
  };
};
