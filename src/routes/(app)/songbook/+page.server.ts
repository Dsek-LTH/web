import type { Prisma } from "@prisma/client";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals, url }) => {
  const prismaClient = locals.prisma;
  const search = url.searchParams.get("search") || "";
  const pageSearch = parseInt(search);
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const take = 20;
  const skip = (page - 1) * take;

  const where: Prisma.SongBookEntryWhereInput = {
    // Search by page instead of title if search query is a number
    ...(pageSearch > 0
      ? { page: { equals: pageSearch } }
      : {
          song: {
            title: {
              contains: search,
              mode: "insensitive",
            },
          },
        }),
  };

  const [songs, totalCount] = await Promise.all([
    prismaClient.songBookEntry.findMany({
      where,
      take,
      skip,
      //TODO: sort by best match
      orderBy: [{ page: "asc" }, { numberOnPage: "asc" }],
      include: {
        song: true,
      },
    }),
    prismaClient.songBookEntry.count({
      where,
    }),
  ]);

  return {
    songs,
    pageCount: Math.ceil(totalCount / take),
    currentPage: page,
    search,
  };
};
