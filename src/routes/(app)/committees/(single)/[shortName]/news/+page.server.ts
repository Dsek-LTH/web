import { BASIC_ARTICLE_FILTER } from "$lib/news/articles";
import type { PageServerLoad } from "../$types";

export const load: PageServerLoad = async ({ locals, params }) => {
  const { prisma } = locals;
  const { shortName } = params;

  const articles = await prisma.article.findMany({
    where: {
      ...BASIC_ARTICLE_FILTER(),
      committee: { shortName: shortName },
    },
    orderBy: {
      publishedAt: "desc",
    },
    take: 5,
    include: {
      author: {
        include: {
          member: true,
          mandate: {
            include: {
              position: true,
            },
          },
          customAuthor: true,
        },
      },
    },
  });
  return { articles };
};
