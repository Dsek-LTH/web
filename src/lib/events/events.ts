import { NOLLNING_TAG_PREFIX } from "$lib/components/postReveal/types";
import type { Prisma } from "@prisma/client";

// function so "new Date()" is not called at import time
export const BASIC_EVENT_FILTER = (
  showNollningEventsInstead = false,
): Prisma.EventWhereInput => ({
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
  OR: [{ removedAt: { gt: new Date() } }, { removedAt: null }],
});
