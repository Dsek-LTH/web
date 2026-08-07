import { BASIC_ARTICLE_FILTER } from "$lib/news/articles";

export const load = async ({ locals }) => {
  const { prisma } = locals;
  const articles = await prisma.article.findMany({
    where: {
      ...BASIC_ARTICLE_FILTER(true),
      publishedAt: {
        gte: new Date("2026-01-01"), // NEEDS TO BE UPDATED EVERY YEAR
      },
    },
    orderBy: {
      publishedAt: "desc",
    },
    include: {
      author: {
        include: {
          member: true,
          customAuthor: true,
          mandate: {
            include: {
              position: true,
            },
          },
        },
      },
    },
  });
  return {
    messages: articles,
  };
};
