import { error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { BASIC_EVENT_FILTER } from "$lib/events/events";

export const GET: RequestHandler = async ({ locals, url }) => {
  const { prisma } = locals;
  const search = url.searchParams.get("search")?.toLowerCase();

  if (search == undefined || search.length === 0) {
    throw error(400, "you need to provide a search value");
  }

  const searchString = search
    .split(" ")
    .filter((part) => part.length > 0)
    .join(" | ");

  const events = await prisma.event.findMany({
    where: {
      AND: [
        BASIC_EVENT_FILTER(null),
        {
          OR: [
            {
              title: {
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
              title: {
                search: searchString,
              },
            },
            {
              titleEn: {
                search: searchString,
              },
            },
          ],
        },
      ],
    },
    orderBy: [
      {
        _relevance: {
          fields: ["title"],
          search: searchString,
          sort: "desc",
        },
      },
      {
        _relevance: {
          fields: ["titleEn"],
          search: searchString,
          sort: "desc",
        },
      },
      {
        startDatetime: "desc",
      },
    ],
    take: 20,
  });
  return new Response(JSON.stringify(events));
};
