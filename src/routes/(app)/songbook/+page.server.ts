import type { Prisma } from "@prisma/client";
import type { PageServerLoad } from "./$types";
import { canAccessDeletedSongs, getExistingCategories } from "./helpers";
import {
  getPageOrThrowSvelteError,
  getPageSizeOrThrowSvelteError,
} from "$lib/utils/url.server";

export const load: PageServerLoad = async ({ locals, url }) => {
  const { prisma, user } = locals;
  const songCount = await prisma.song.count();
  const pageSize = getPageSizeOrThrowSvelteError(url);
  const page = getPageOrThrowSvelteError(url, {
    upperBound: Math.ceil(songCount / pageSize),
  });
  const search = url.searchParams.get("search");
  const categories = url.searchParams.getAll("category");
  const accessPolicies = user?.policies ?? [];
  const showDeleted =
    canAccessDeletedSongs(accessPolicies) &&
    url.searchParams.get("show-deleted") === "true";

  let where: Prisma.SongWhereInput = search
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

  if (categories.length > 0) {
    where = {
      AND: [
        where,
        {
          OR: categories.map((category) => ({
            category: {
              contains: category,
              mode: "insensitive",
            },
          })),
        },
      ],
    };
  }

  where = {
    AND: [
      where,
      {
        // If the user can access deleted songs, show them if the user wants to
        // Otherwise, don't show deleted songs
        deletedAt: showDeleted ? { not: null } : null,
      },
    ],
  };

  const [songs, pageCount, existingCategories] = await Promise.all([
    prisma.song.findMany({
      take: pageSize,
      skip: Math.max((page - 1) * pageSize, 0), // If page is 1, we don't skip anything, otherwise we skip (page - 1) * pageSize
      orderBy: { createdAt: "desc" },
      where,
    }),
    prisma.song.count({ where }),
    getExistingCategories(prisma, accessPolicies, showDeleted),
  ]);

  const categoryMap: Record<string, string> = {};

  for (const category of existingCategories) {
    const split = category.split(" ");

    let id;
    if (split) {
      if (split[0] == "SåS") {
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

  return {
    songs: songs,
    pageCount: Math.ceil(pageCount / pageSize),
    categories,
    categoryMap,
    params: url.searchParams.toString(),
  };
};
