import type { PageServerLoad } from "./$types";
import { getAlbums } from "./getAlbums";

export const load: PageServerLoad = async ({ locals }) => {
  const albumEntries = getAlbums(locals.prisma, locals.user);

  return {
    albums: await albumEntries,
  };
};
