import type { ExtendedPrisma } from "$lib/server/extendedPrisma";
import { slugify } from "$lib/utils/slugify";

export const slugifySongTitle = async (
  prisma: ExtendedPrisma,
  title: string,
) => {
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
