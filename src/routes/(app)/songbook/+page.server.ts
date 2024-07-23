import { fixSongText } from "./helpers";
import type { PageServerLoad } from "./$types";
import type { Prisma } from "@prisma/client";
import DOMPurify from "isomorphic-dompurify";
import { canAccessDeletedSongs, getExistingCategories } from "./helpers";

const SONGS_PER_PAGE = 10;

// TODO: Cache
export const load: PageServerLoad = async ({ locals, url }) => {
  const { prisma, user } = locals;
  const page = url.searchParams.get("page");
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
      take: SONGS_PER_PAGE,
      skip: page
        ? Math.max((Number.parseInt(page) - 1) * SONGS_PER_PAGE, 0)
        : 0,
      orderBy: { title: "asc" },
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
    songs: songs.map((song) => ({
      ...song,
      title: DOMPurify.sanitize(fixSongText(song.title)),
      lyrics: DOMPurify.sanitize(fixSongText(song.lyrics)),
    })),
    pageCount: Math.max(Math.ceil(pageCount / SONGS_PER_PAGE), 1),
    categories,
    categoryMap,
    params: url.searchParams.toString(),
  };
};
