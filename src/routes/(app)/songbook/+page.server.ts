import apiNames from "$lib/utils/apiNames";
import authorizedPrismaClient from "$lib/server/authorizedPrisma";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals, url }) => {
  const { user } = locals;
  const showDeleted =
    user?.policies?.includes(apiNames.SONG.DELETE) &&
    url.searchParams.get("show-deleted") === "true";
  const prismaClient = showDeleted ? authorizedPrismaClient : locals.prisma;

  const search = url.searchParams.get("search") || "";
  const categoryFilter = url.searchParams.getAll("category");
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const take = 20;
  const skip = (page - 1) * take;

  const where = {
    ...(showDeleted ? { deletedAt: { not: null } } : { deletedAt: null }),
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" as const } },
            { lyrics: { contains: search, mode: "insensitive" as const } },
            { melody: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(categoryFilter.length > 0
      ? {
          category: { in: categoryFilter },
        }
      : {}),
  };

  const [songs, totalCount, distinctCategories] = await Promise.all([
    prismaClient.song.findMany({
      where,
      take,
      skip,
      orderBy: { title: "asc" },
    }),
    prismaClient.song.count({ where }),
    prismaClient.song.findMany({
      where: showDeleted ? { deletedAt: { not: null } } : { deletedAt: null },
      select: { category: true },
      distinct: ["category"],
    }),
  ]);

  const categories = distinctCategories
    .map((c) => c.category)
    .filter((c): c is string => c !== null);

  return {
    songs,
    pageCount: Math.ceil(totalCount / take),
    categories,
    currentPage: page,
    search,
    categoryFilter,
    showDeleted,
  };
};
