import authorizedPrismaClient from "$lib/server/authorizedPrisma";
import type { PageServerLoad } from "./$types";
import { canAccessDeletedSongs, getExistingCategories } from "./helpers";

export const load: PageServerLoad = async ({ locals, url }) => {
  const { user } = locals;
  const accessPolicies = user?.policies ?? [];
  const showDeleted =
    canAccessDeletedSongs(accessPolicies) &&
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
          OR: categoryFilter.map((category) => ({
            category: {
              contains: category,
              mode: "insensitive" as const,
            },
          })),
        }
      : {}),
  };

  const [songs, totalCount, rawCategories] = await Promise.all([
    prismaClient.song.findMany({
      where,
      take,
      skip,
      orderBy: { title: "asc" },
    }),
    prismaClient.song.count({ where }),
    getExistingCategories(prismaClient, accessPolicies, showDeleted),
  ]);

  const categoryMap: Record<string, string> = {};

  for (const category of rawCategories) {
    const split = category.split(" ");

    let id;
    if (split) {
      if (split[0] === "SåS") {
        id = split.slice(0, 2).join(" ");
      } else {
        id = split ? split[0] : undefined;
      }
    } else {
      id = undefined;
    }

    if (id) {
      if (categoryMap[id]) {
        categoryMap[id] = id;
      } else {
        categoryMap[id] = category ?? id;
      }
    }
  }

  const categories = Object.keys(categoryMap);

  return {
    songs,
    pageCount: Math.ceil(totalCount / take),
    categories,
    categoryMap,
    currentPage: page,
    search,
    categoryFilter,
    showDeleted,
  };
};
