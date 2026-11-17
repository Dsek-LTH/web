import type { ExtendedPrisma } from "$lib/server/extendedPrisma";
import { N0LLNING_TAG_PREFIX } from "$lib/components/postReveal/types";

export const getAllTags = (
  prisma: ExtendedPrisma,
  includeN0llningTag = false,
) =>
  prisma.tag.findMany({
    orderBy: { nameSv: "asc" },
    where: includeN0llningTag
      ? undefined
      : {
          NOT: {
            nameSv: {
              startsWith: N0LLNING_TAG_PREFIX,
            },
          },
        },
  });
