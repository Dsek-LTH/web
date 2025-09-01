import type { ExtendedPrisma } from "$lib/server/extendedPrisma";
import { BASIC_EVENT_FILTER } from "$lib/events/events";
import type { Prisma } from "@prisma/client";

type EventFilters = {
  tags?: string[];
  search?: string;
  page?: number;
  pageSize?: number;
  pastEvents?: boolean;
};

const include = {
  author: true,
  comments: {
    include: {
      member: true,
    },
  },
  going: true,
  interested: true,
  tags: true,
};

export const getAllEvents = async (
  prisma: ExtendedPrisma,
  filters: EventFilters = { page: 0, pageSize: 10 },
  baseFilter = true,
): Promise<[EventWithIncludes[], number]> => {
  const pageNumber = filters.page ?? 0;
  const pageSize = filters.pageSize ?? 10;

  const base = BASIC_EVENT_FILTER();
  const where: Prisma.EventWhereInput = {
    AND: [
      baseFilter ? base : {},
      {
        endDatetime: filters.pastEvents
          ? {
              lte: new Date(),
            }
          : {
              gte: new Date(),
            },
        // search:
        ...(filters.search && filters.search.length > 0
          ? {
              OR: [
                {
                  title: {
                    contains: filters.search,
                    mode: "insensitive",
                  },
                },
                {
                  titleEn: {
                    contains: filters.search,
                    mode: "insensitive",
                  },
                },
                {
                  shortDescription: {
                    contains: filters.search,
                    mode: "insensitive",
                  },
                },
                {
                  shortDescriptionEn: {
                    contains: filters.search,
                    mode: "insensitive",
                  },
                },
                {
                  description: {
                    contains: filters.search,
                    mode: "insensitive",
                  },
                },
                {
                  descriptionEn: {
                    contains: filters.search,
                    mode: "insensitive",
                  },
                },
              ],
            }
          : {}),
        // tags
        ...(filters.tags && filters.tags.length > 0
          ? {
              tags: {
                some: {
                  OR: [
                    {
                      name: {
                        in: filters.tags,
                        mode: "insensitive",
                      },
                    },
                    {
                      nameEn: {
                        in: filters.tags,
                        mode: "insensitive",
                      },
                    },
                  ],
                },
              },
            }
          : {}),
      },
    ],
  };
  // Don't run as transaction, a little read only data race is fine
  const [events, count] = await Promise.all([
    prisma.event.findMany({
      where,
      orderBy: {
        startDatetime: filters.pastEvents ? "desc" : "asc",
      },
      skip: Math.max(pageNumber - 1, 0) * pageSize,
      take: pageSize,
      include,
    }),
    prisma.event.count({ where }),
  ]);
  return [events, Math.ceil(count / pageSize)];
};

export const getEvent = async (prisma: ExtendedPrisma, slug: string) => {
  const response = await prisma.event.findUnique({
    where: {
      slug,
    },
    include,
  });
  return response;
};

export type EventWithIncludes = NonNullable<
  Awaited<ReturnType<typeof getEvent>>
>;
