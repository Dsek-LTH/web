import { NOLLNING_TAG_PREFIX } from "$lib/components/postReveal/types";
import type { Prisma } from "@prisma/client";

// function so "new Date()" is not called at import time
export const BASIC_ARTICLE_FILTER = (
  showNollningEventsInstead = false,
): Prisma.ArticleWhereInput => ({
  tags: showNollningEventsInstead
    ? {
        some: {
          name: {
            startsWith: NOLLNING_TAG_PREFIX,
          },
        },
      }
    : {
        none: {
          name: {
            startsWith: NOLLNING_TAG_PREFIX,
          },
        },
      },
  publishedAt: {
    lte: new Date(),
    not: null,
  },
  OR: [{ removedAt: { gt: new Date() } }, { removedAt: null }],
});
