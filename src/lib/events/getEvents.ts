import type { ExtendedPrisma } from "$lib/server/extendedPrisma";
import { BASIC_EVENT_FILTER } from "$lib/events/events";
import type { Prisma } from "@prisma/client";
import dayjs from "dayjs";

export type EventFilters = {
  tags?: string[];
  search?: string;
} & EventSpan;

export type EventSpan =
  | {
      page: number;
      pageSize: number;
      span: "past" | "upcoming";
    }
  | {
      weekStartingAt: Date;
    }
  | {
      monthStartingAt: Date;
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

/// Returns a filter for events containing the search string anywhere in the event text.
const searchFilter = (search: string): Prisma.EventWhereInput => ({
  OR: [
    {
      titleSv: {
        contains: search,
        mode: "insensitive",
      },
    },
    {
      titleEn: {
        contains: search,
        mode: "insensitive",
      },
    },
    {
      shortDescriptionSv: {
        contains: search,
        mode: "insensitive",
      },
    },
    {
      shortDescriptionEn: {
        contains: search,
        mode: "insensitive",
      },
    },
    {
      descriptionSv: {
        contains: search,
        mode: "insensitive",
      },
    },
    {
      descriptionEn: {
        contains: search,
        mode: "insensitive",
      },
    },
  ],
});

/// Returns a filter for events matching any of the tags.
const tagFilter = (tags: string[]): Prisma.EventWhereInput => ({
  tags: {
    some: {
      OR: [
        {
          nameSv: {
            in: tags,
            mode: "insensitive",
          },
        },
        {
          nameEn: {
            in: tags,
            mode: "insensitive",
          },
        },
      ],
    },
  },
});

export const getEvents = async (
  prisma: ExtendedPrisma,
  filters: EventFilters = { page: 1, pageSize: 10, span: "upcoming" },
  baseFilter = true,
): Promise<[EventWithIncludes[], number]> => {
  const is_paginated = "page" in filters;

  let page = undefined;
  let pageSize = undefined;
  let order: "asc" | "desc" = "desc";
  let after = undefined;
  let before = undefined;

  if (is_paginated) {
    page = filters.page;
    pageSize = filters.pageSize;

    if (filters.span == "past") {
      order = "asc";
    }
  } else {
    if ("weekStartingAt" in filters) {
      after = filters.weekStartingAt;
      before = dayjs(filters.weekStartingAt).add(1, "week").toDate();
    } else {
      after = filters.monthStartingAt;
      before = dayjs(filters.monthStartingAt).add(1, "month").toDate();
    }
  }

  const where: Prisma.EventWhereInput = {
    AND: [
      baseFilter ? BASIC_EVENT_FILTER() : {},
      filters.search && filters.search.length > 0
        ? searchFilter(filters.search)
        : {},
      filters.tags && filters.tags.length > 0 ? tagFilter(filters.tags) : {},
      after !== undefined ? { endDatetime: { gt: after } } : {},
      before !== undefined ? { startDatetime: { lt: before } } : {},
    ],
  };

  // Don't run as transaction, a little read only data race is fine
  const [events, count] = await Promise.all([
    prisma.event.findMany({
      where,
      orderBy: {
        startDatetime: order,
      },
      skip: (page ?? 0) * (pageSize ?? 0),
      take: pageSize,
      include,
    }),
    prisma.event.count({ where }),
  ]);

  return [events, Math.ceil(count / (pageSize ?? 1))];
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
