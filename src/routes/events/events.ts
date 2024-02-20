import type { Prisma, PrismaClient } from "@prisma/client";

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
  prisma: PrismaClient,
  filters: EventFilters = { page: 0, pageSize: 10 },
): Promise<[EventWithIncludes[], number]> => {
  const pageNumber = filters.page ?? 0;
  const pageSize = filters.pageSize ?? 10;

  const where: Prisma.EventWhereInput = {
    endDatetime: filters.pastEvents
      ? {
          lte: new Date(),
        }
      : {
          gte: new Date(),
        },
    OR: [{ removedAt: { gt: new Date() } }, { removedAt: null }],
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
  };
  const [events, count] = await prisma.$transaction(async (tx) => {
    const events = tx.event.findMany({
      where,
      orderBy: {
        startDatetime: filters.pastEvents ? "desc" : "asc",
      },
      skip: pageNumber * pageSize,
      take: pageSize,
      include,
    });
    const count = tx.event.count({ where });
    return [await events, await count];
  });
  return [events, Math.ceil(count / pageSize)];
};

export const getEvent = async (prisma: PrismaClient, slug: string) => {
  const response = await prisma.event.findUnique({
    where: {
      slug,
      OR: [{ removedAt: { gt: new Date() } }, { removedAt: null }],
    },
    include,
  });
  return response;
};

type EventWithIncludes = NonNullable<Awaited<ReturnType<typeof getEvent>>>;
