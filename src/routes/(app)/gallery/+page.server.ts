import type { PageServerLoad } from "./$types";
import { getAlbums } from "./getAlbums";

export const load: PageServerLoad = async ({ locals }) => {
  const { prisma, user } = locals;
  const albumEntries: Promise<Array<Record<string, unknown>>> = getAlbums(
    prisma,
    user,
  );

  return {
    albums: await albumEntries,
  };
};
