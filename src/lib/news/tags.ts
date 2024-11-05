import { NOLLNING_TAG_PREFIX } from "$lib/components/postReveal/types";
import type { PrismaClient } from "@prisma/client";

export const getAllTags = (prisma: PrismaClient, includeNollningTag = false) =>
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
