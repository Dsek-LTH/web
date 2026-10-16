import { N0LLNING_TAG_PREFIX } from "$lib/components/postReveal/types";
import type { ExtendedPrismaModel } from "$lib/server/extendedPrisma";
import type { Prisma } from "@prisma/client";

// function so "new Date()" is not called at import time
export const BASIC_EVENT_FILTER = (
  showN0llningEventsInstead: boolean | null = false,
): Prisma.EventWhereInput => ({
  tags:
    showN0llningEventsInstead !== null
      ? showN0llningEventsInstead
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
          }
      : undefined,
  OR: [{ removedAt: { gt: new Date() } }, { removedAt: null }],
});

export const eventLink = (
  event: Pick<ExtendedPrismaModel<"Event">, "id" | "slug">,
) => (event.slug ? `/events/${event.slug}` : `/events/id/${event.id}`);
