import { NOLLNING_TAG_PREFIX } from "$lib/components/postReveal/types";
import type { Prisma } from "@prisma/client";

// function so "new Date()" is not called at import time
export const BASIC_EVENT_FILTER = (
  showNollningEventsInstead: boolean | null = false,
): Prisma.EventWhereInput => ({
  tags:
    showNollningEventsInstead !== null
      ? showNollningEventsInstead
        ? {
            some: {
              nameSv: {
                startsWith: NOLLNING_TAG_PREFIX,
              },
            },
          }
        : {
            none: {
              nameSv: {
                startsWith: NOLLNING_TAG_PREFIX,
              },
            },
          }
      : undefined,
  OR: [{ removedAt: { gt: new Date() } }, { removedAt: null }],
});
