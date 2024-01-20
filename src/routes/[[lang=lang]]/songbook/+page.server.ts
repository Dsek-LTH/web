import prisma from "$lib/utils/prisma";
import { fixSongText } from "./helpers";
import type { PageServerLoad } from "./$types";
import type { Prisma } from "@prisma/client";
import isomorphicDompurify from "isomorphic-dompurify";
import { canAccessDeletedSongs, getExistingCategories } from "./helpers";
const { sanitize } = isomorphicDompurify;

const SONGS_PER_PAGE = 10;

export const load: PageServerLoad = async ({ url, parent }) => {
  const { accessPolicies } = await parent();
  const page = url.searchParams.get("page");
  const search = url.searchParams.get("search");
  const category = url.searchParams.get("category");
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

  if (category) {
    where = {
      AND: [
        where,
        {
          category: {
            startsWith: category,
          },
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
    getExistingCategories(accessPolicies, showDeleted),
  ]);

  const categories: { [key: string]: string } = {};

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
      if (categories[id]) {
        categories[id] = id;
      } else {
        categories[id] = category ?? id;
      }
    }
  }

  return {
    songs: songs.map((song) => ({
      ...song,
      title: sanitize(fixSongText(song.title)),
      lyrics: sanitize(fixSongText(song.lyrics)),
    })),
    pageCount: Math.max(Math.ceil(pageCount / SONGS_PER_PAGE), 1),
    categories,
    category,
    params: url.searchParams.toString(),
  };
};
