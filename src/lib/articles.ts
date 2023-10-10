import prisma from "$lib/prisma";

export const getAllArticles = async () => {
  const response = await prisma.article.findMany({
    where: {
      publishedAt: {
        lte: new Date(),
        not: null,
      },
    },
    orderBy: {
      publishedAt: "desc",
    },
    include: {
      author: {
        include: {
          member: true,
          mandate: {
            include: {
              position: true,
            },
          },
        },
      },
      likes: {
        include: {
          member: true,
        },
      },
      tags: true,
    },
  });
  return response;
};

export const getArticle = async (slug: string) => {
  const response = await prisma.article.findUnique({
    where: {
      slug,
      publishedAt: {
        lte: new Date(),
        not: null,
      },
    },
    include: {
      author: {
        include: {
          member: true,
          mandate: {
            include: {
              position: true,
            },
          },
        },
      },
      likes: {
        include: {
          member: true,
        },
      },
      tags: true,
    },
  });
  return response;
};

export type Article = NonNullable<Awaited<ReturnType<typeof getArticle>>>;
