import { NOLLNING_TAG_PREFIX } from "$lib/components/postReveal/types.js";

export const load = async ({ locals }) => {
  const { prisma } = locals;
  const articles = await prisma.article.findMany({
    where: {
      publishedAt: {
        gte: new Date("2024-01-01"),
      },
      tags: {
        some: {
          name: {
            startsWith: NOLLNING_TAG_PREFIX,
          },
        },
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
