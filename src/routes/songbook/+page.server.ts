import prisma from "$lib/utils/prisma";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
  const songs = await prisma.song.findMany({});

  return { songs };
};
