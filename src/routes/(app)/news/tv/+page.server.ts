import type { PageServerLoad } from "./$types";
import { getAllArticles } from "../articles";

// TODO: Cache
export const load: PageServerLoad = async ({ locals }) => {
  const { prisma } = locals;
  const [articles] = await getAllArticles(prisma);
  return {
    articles,
  };
};
