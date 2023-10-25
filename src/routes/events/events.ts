import prisma from "$lib/utils/prisma";
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
      author: true,
    },
  },
  going: true,
  interested: true,
  tags: true,
};

export const getAllEvents = async (
  filters: EventFilters = { page: 0, pageSize: 10 }
): Promise<[EventWithIncludes[], number]> => {
  filters.page = filters.page ?? 0;
  filters.pageSize = filters.pageSize ?? 10;

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
  const [events, count] = await prisma.$transaction([
    prisma.event.findMany({
      where,
      orderBy: {
        startDatetime: filters.pastEvents ? "desc" : "asc",
      },
      skip: filters.page * filters.pageSize,
      take: filters.pageSize,
      include,
    }),
    prisma.event.count({ where }),
  ]);
  return [events, Math.ceil(count / filters.pageSize)];
};

export const getEvent = async (slug: string) => {
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
