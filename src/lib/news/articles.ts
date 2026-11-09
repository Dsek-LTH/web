import { N0LLNING_TAG_PREFIX } from "$lib/components/postReveal/types";
import type { Prisma } from "@prisma/client";

// function so "new Date()" is not called at import time
export const BASIC_ARTICLE_FILTER = (
  showN0llningEventsInstead = false,
): Prisma.ArticleWhereInput => ({
  tags: showN0llningEventsInstead
    ? {
        some: {
          nameSv: {
            startsWith: N0LLNING_TAG_PREFIX,
          },
        },
      }
    : {
        none: {
          nameSv: {
            startsWith: N0LLNING_TAG_PREFIX,
          },
        },
      },
  publishedAt: {
    lte: new Date(),
    not: null,
  },
  OR: [{ removedAt: { gt: new Date() } }, { removedAt: null }],
});
