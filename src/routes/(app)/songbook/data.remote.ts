import { getRequestEvent, query } from "$app/server";
import { error } from "@sveltejs/kit";
import z from "zod/v3";
import apiNames from "$lib/utils/apiNames";
import { authorize } from "$lib/utils/authorization";

export const searchSongTitles = query(z.string(), async (titleFilter) => {
  const {
    locals: { user, prisma },
  } = getRequestEvent();
  authorize(apiNames.SONG.CREATE, user);

  if (!query || query.length < 2) {
    return [];
  }

  try {
    // If using ZenStack, use locals.db (your enhanced client).
    // If standard Prisma, use the prisma instance.

    const songs = await prisma.song.findMany({
      where: {
        title: {
          contains: titleFilter,
          mode: "insensitive",
        },
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
      },
      take: 10,
      orderBy: {
        title: "asc",
      },
    });

    return songs;
  } catch (e) {
    console.error("Search failed:", e);
    error(500, "Failed to search songs");
  }
});
