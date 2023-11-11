import prisma from "$lib/utils/prisma";
import type { PageServerLoad } from "./$types";
import type { Prisma } from "@prisma/client";

const nPerPage = 10;

export const load: PageServerLoad = async ({ url }) => {
  const page = url.searchParams.get("page");
  const search = url.searchParams.get("search");

  const where: Prisma.SongWhereInput = search
    ? {
        OR: [
          {
            title: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            lyrics: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            category: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            melody: {
              contains: search,
              mode: "insensitive",
            },
          },
        ],
      }
    : {};

  const [songs, pageCount, categories] = await Promise.all([
    prisma.song.findMany({
      take: nPerPage,
      skip: page ? Math.max((Number.parseInt(page) - 1) * nPerPage, 0) : 0,
      orderBy: [{ category: "asc" }, { title: "asc" }],
      where,
    }),
    prisma.song.count({ where }),
    prisma.song.findMany({
      select: {
        category: true,
      },
      distinct: ["category"],
      orderBy: {
        category: "asc",
      },
    }),
  ]);

  return {
    songs,
    pageCount: Math.max(Math.ceil(pageCount / nPerPage), 1),
    categories,
  };
};
