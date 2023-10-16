import prisma from "$lib/prisma";

export const slugify = (str: string) => {
  const slug = str.replace(/\s+/g, "-").toLowerCase();
  return slug.length > 50 ? slug.slice(0, 50) : slug;
};

export const slugifyArticleHeader = async (header: string) => {
  const slug = slugify(header);
  let number = 0;
  let count = await prisma.article.count({
    where: {
      slug,
    },
  });
  // reserved slugs
  if (["create", "tags"].includes(slug)) {
    count = 1;
  }
  while (count > 0) {
    number += 1;
    count = await prisma.article.count({
      where: {
        slug: `${slug}-${number}`,
      },
    });
  }
  if (number > 0) {
    return `${slug}-${number}`;
  }
  return slug;
};
