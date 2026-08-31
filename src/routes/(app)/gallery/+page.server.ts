import type { PageServerLoad } from "./$types";
import { getAlbums } from "./getAlbums";

export const load: PageServerLoad = async ({ locals }) => {
  const albumEntries: Promise<Record<string, unknown>[]> = getAlbums(
    locals.prisma,
    locals.user,
  );

  return {
    albums: await albumEntries,
  };
};
