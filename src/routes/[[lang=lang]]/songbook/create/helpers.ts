import { slugify } from "$lib/utils/slugify";
import type { PrismaClient } from "@prisma/client";

export const slugifySongTitle = async (prisma: PrismaClient, title: string) => {
  const slug = slugify(title);
  const count = await prisma.song.count({
    where: {
      slug: {
        startsWith: slug,
      },
    },
  });

  if (count > 0) {
    return `${slug}-${count + 1}`;
  }
  return slug;
};
