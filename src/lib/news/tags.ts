import type { ExtendedPrisma } from "$lib/server/extendedPrisma";
import { NOLLNING_TAG_PREFIX } from "$lib/components/postReveal/types";

export const getAllTags = (prisma: ExtendedPrisma, includeNollningTag = false) =>
  prisma.tag.findMany({
    orderBy: { name: "asc" },
    where: includeNollningTag
      ? undefined
      : {
          NOT: {
            name: {
              startsWith: NOLLNING_TAG_PREFIX,
            },
          },
        },
  });
