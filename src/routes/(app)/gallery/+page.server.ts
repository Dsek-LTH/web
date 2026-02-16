import { PUBLIC_BUCKETS_ALBUMS } from "$env/static/public";
import { fileHandler } from "$lib/files";
import type { FileData } from "$lib/files/fileHandler";
import type { PageServerLoad } from "./$types";
import { getAlbums } from "./getAlbums";

export const load: PageServerLoad = async ({ locals }) => {
  const albumEntries = getAlbums(locals.prisma);

  return {
    albums: await albumEntries,
  };
};
