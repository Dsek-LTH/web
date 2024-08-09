import { BASIC_ARTICLE_FILTER } from "$lib/news/articles.js";

export const load = async ({ locals }) => {
  const { prisma } = locals;
  const articles = await prisma.article.findMany({
    where: {
      ...BASIC_ARTICLE_FILTER(true),
      publishedAt: {
        gte: new Date("2024-01-01"),
      },
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
