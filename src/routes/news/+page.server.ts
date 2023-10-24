import type { PageServerLoad } from "./$types";
import { getAllArticles } from "./articles";

export const load: PageServerLoad = async () => {
  const articles = await getAllArticles();
  return {
    articles,
  };
};
