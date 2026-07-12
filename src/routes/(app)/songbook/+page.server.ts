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

  // Map each category to a group ID and display name.
  // -> "SåS ..." categories are grouped by their first two words (e.g. "SåS Fria").
  //    If "SåS" has no second word, it's grouped by itself.
  // -> All other categories are grouped by their first word (e.g. "Nollningen").
  // The first category seen for a group is used as its display name; if a
  // second category maps to the same group, the display name falls back to
  // the group ID itself (since a single category name would no longer be accurate).
  const categoryMap: Record<string, string> = {};

  for (const category of rawCategories) {
    const words = category.split(" ");
    const firstWord = words[0];
    if (!firstWord) continue;

    const groupId =
      firstWord === "SåS" ? words.slice(0, 2).join(" ") : firstWord;

    categoryMap[groupId] =
      categoryMap[groupId] !== undefined ? groupId : category;
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
